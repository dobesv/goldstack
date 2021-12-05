import { NextjsDeployment } from './types/NextJsPackage';
import { getAWSUser } from '@goldstack/infra-aws';
import { readTerraformStateVariable, DeploymentState } from '@goldstack/infra';
import { zip, cp, write, rmSafe, read, mkdir } from '@goldstack/utils-sh';
import { awsCli } from '@goldstack/utils-aws-cli';
import webpack from 'webpack';
import util from 'util';
import globFunc from 'glob';
import { packageEdgeLambda } from './edgeLambdaPackage';

const glob = util.promisify(globFunc);

interface DeployLambdaParams {
  deployment: NextjsDeployment;
  deploymentState: DeploymentState;
}

export const deployEdgeLambda = async (
  params: DeployLambdaParams
): Promise<void> => {
  const targetArchive = 'lambda.zip';
  const lambdaSourceDir = './src/utils/routing/';
  const lambdaCompiledDir = './dist/src/utils/routing/';
  const lambdaPackageDir = './dist/edgeLambda/';

  // Getting the latest manifest containing Next js dynamic routes
  const routesManifest = JSON.parse(read('./.next/routes-manifest.json'));

  // adding in statically rendered pages
  const dynamicRoutes = routesManifest.dynamicRoutes;
  const htmlPagePaths: string[] = await glob('webDist/**/*.html');
  const htmlPagePathsWithoutRootDir = htmlPagePaths.map((match) => {
    const els = match.split('/');
    els.shift();
    const withoutRootDir = els.join('/');
    return withoutRootDir;
  });
  const htmlPagePathsWithoutExtension = htmlPagePathsWithoutRootDir.map(
    (match) => {
      const comps = match.split('.');
      comps.pop();
      const withoutExtension = comps.join('.');
      return withoutExtension;
    }
  );

  const staticRoutes = htmlPagePathsWithoutExtension.map((match) => ({
    page: '/' + match,
    regex: `^\\/${match.replace(/\//g, '\\/')}$`,
  }));

  routesManifest.dynamicRoutes = [...staticRoutes, ...dynamicRoutes];
  // Making sure there are no linting errors with copied file
  await rmSafe(`${lambdaSourceDir}routes-manifest.json`);
  write(
    JSON.stringify(routesManifest, null, 2),
    `${lambdaSourceDir}routes-manifest.json`
  );
  await rmSafe(`${lambdaCompiledDir}routes-manifest.json`);
  cp(
    '-f',
    `${lambdaSourceDir}routes-manifest.json`,
    `${lambdaCompiledDir}routes-manifest.json`
  );

  // pack source for Lambda Node.js runtime

  await rmSafe(lambdaPackageDir);
  mkdir('-p', lambdaPackageDir);

  await packageEdgeLambda({
    sourceFile: `${lambdaCompiledDir}lambda.js`,
    destFile: `${lambdaPackageDir}lambda.js`,
  });

  await rmSafe(targetArchive);
  await zip({ directory: lambdaPackageDir, target: targetArchive });

  const credentials = await getAWSUser(params.deployment.awsUser);
  const functionName = readTerraformStateVariable(
    params.deploymentState,
    'edge_function_name'
  );
  const deployResult = awsCli({
    credentials,
    region: 'us-east-1',
    command: `lambda update-function-code --function-name ${functionName} --zip-file fileb://${targetArchive} --publish`,
  });
  await rmSafe(targetArchive);

  const { FunctionArn } = JSON.parse(deployResult);

  const qualifiedArn = `${FunctionArn}`;

  let counter = 0;
  let state = '';
  while (counter < 20 && state !== 'Active') {
    const res = awsCli({
      credentials,
      region: 'us-east-1',
      command: `lambda get-function --function-name ${functionName}`,
    });
    const data = JSON.parse(res);
    state = data.Configuration.State;
    counter++;
  }
  if (counter >= 20) {
    throw new Error(`Function was still in state '${state}' after deployment`);
  }

  // Add a wait since there sometimes appear to be race conditions
  // CF thinking the lambda is not in active state
  // notwithstanding the above check
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 10000);
  });

  const cfDistributionResult = awsCli({
    credentials,
    region: 'us-east-1',
    command: `cloudfront get-distribution-config --id ${readTerraformStateVariable(
      params.deploymentState,
      'website_cdn_root_id'
    )}`,
    options: { silent: true },
  });

  const cfDistribution = JSON.parse(cfDistributionResult);

  const eTag = cfDistribution.ETag;
  const lambdaFunctionAssociations =
    cfDistribution.DistributionConfig.DefaultCacheBehavior
      .LambdaFunctionAssociations.Items;
  lambdaFunctionAssociations[0].LambdaFunctionARN = qualifiedArn;

  await rmSafe('./dist/cf.json');
  write(
    JSON.stringify(cfDistribution.DistributionConfig, null, 2),
    './dist/cf.json'
  );
  awsCli({
    credentials: await getAWSUser(params.deployment.awsUser),
    region: 'us-east-1',
    command: `cloudfront update-distribution --id ${readTerraformStateVariable(
      params.deploymentState,
      'website_cdn_root_id'
    )} --distribution-config file://dist/cf.json --if-match ${eTag}`,
    options: { silent: true },
  });
  await rmSafe('./dist/cf.json');
};
