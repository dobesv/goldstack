Thanks for taking the time to contribute! While the following documentation intends to be as comprehensive as possible, please do not hesitate to reach out by [opening a GitHub issue](https://github.com/goldstack/goldstack/issues) or on Twitter: [@mxro](https://twitter.com/mxro).

## Getting Started with Development

### Project Setup

*   Clone the Goldstack repository
*   Ensure dependencies are installed

```sh
node -v
yarn -v
docker --version
```

*   Install dependencies, run `yarn` in the cloned directory

```sh
yarn
```

After the installation is complete, you can verify that Yarn 2+ has been initialised by running:

```sh
yarn -v
# > 3.0.2+
```

You can now compile/build the project:

```sh
yarn compile
yarn build
```

Note it is not necessary to run `yarn` or `yarn compile` for the individual nested workspaces and packages in the repository. Running `yarn` and `yarn compile` will compile/install all nested workspaces and packages.

### Project Structure

The Goldstack monorepo is a repository nested in two levels. [workspaces](https://github.com/goldstack/goldstack/tree/master/workspaces) itself contains the following composite packages:

*   [apps](https://github.com/goldstack/goldstack/tree/master/workspaces/apps) - contains the [Goldstack website](https://goldstack.party) and backend
*   [docs](https://github.com/goldstack/goldstack/tree/master/workspaces/docs) - contains the [Goldstack documentation](https://docs.goldstack.party/docs)
*   [template-lib](https://github.com/goldstack/goldstack/tree/master/workspaces/templates-lib) - contains packages that are used as dependencies of templates to support the build process and development.
*   [template-management](https://github.com/goldstack/goldstack/tree/master/workspaces/templates-management) - contains utilities for developing and testing templates.
*   [template](https://github.com/goldstack/goldstack/tree/master/workspaces/templates) - contains the blueprint for Goldstack templates

### Developing Goldstack Alongside your Project

When you generate a new project with Goldstack, your *generated project* will be version linked to [official packages published in NPM](https://www.npmjs.com/search?q=keywords:goldstack). In order to change any of the *official packages* and test them against your *generated project*, you will need to connect your recently *generated project* to a *local Goldstack monorepo* instead of the *official packages*.

The source code for the *official packages* is defined in the Goldstack monorepo (this repo) under [template-lib](https://github.com/goldstack/goldstack/tree/master/workspaces/templates-lib).

### Link your *generated project* to a *local Goldstack monorepo*

You can use the [`yarn link`](https://yarnpkg.com/en/docs/cli/link) command to link your *generated project* to a *local Goldstack monorepo* instead of the *official packages*.

For this, clone the [Goldstack Monorepo](https://github.com/goldstack/goldstack) into a folder on your local machine. Then within your *generated project*, run the following command:

```sh
yarn link /path/to/goldstack/monorepo/ -Apr
```

Now, if you make any changes to the libraries in the *local Goldstack monorepo*, these will be effective when running `yarn template-ts` scripts in your *generated project*.

### Copy your *generated project* as a yarn workspace under a *local Goldstack monorepo*

Since [Yarn workspaces](https://yarnpkg.com/features/workspaces) allow for embedding multiple projects in a single monorepo, you can copy your *generated project* as a yarn workspace under a *local Goldstack monorepo* by following these steps:

#### Copy your generated project into the folder: `workspaces/generated`

![](https://user-images.githubusercontent.com/1448524/155213397-2b67a16d-fb76-476e-bfcf-314903dcc046.png)

It is important to place the generated project into the `workspaces/generated` folder since this is ignored by Git in the Goldstack monorepo.

#### *Delete* the following files/folders

*   `workspaces/generated/.yarn`
*   `workspaces/generated/.yarnrc.yml`
*   `workspaces/generated/yarn.lock`

#### Update all references to use the local package version numbers.

You need to ensure that the versions referenced in the `package.json` files in the *generated project* match the versions of the library source code in the *local Goldstack monorepo*.

You can run the command `yarn ensure-local-packages` from `<goldstack>` root to do this.

#### Rebuild the *local Goldstack monorepo*

Now that the *generated project* is a yarn workspace within the *local Goldstack monorepo* you can simply run the `yarn` command to build everything.

#### Testing

If you make changes to the libraries in [template-lib](https://github.com/goldstack/goldstack/tree/master/workspaces/templates-lib), these will be available in your generated project and can be invoked using `yarn template-ts *`.

You can take a look this video if you have any issues getting this working: <https://youtu.be/wIXxhM4qWkA>

You can commit any changes to the Goldstack monorepo for a PR to this repository. You must use a separate git repository for your own project. Therefore it is important to place the generated project into the `workspaces/generated` folder since this is added to the `.gitignore` file in the Goldstack monorepo.
