import React from 'react';

import Plus from './../icons/font-awesome/solid/plus.svg';
import Check from './../icons/font-awesome/solid/check.svg';

import { dataUriToSrc } from './../utils/utils';

import styles from './PackageCard.module.css';

interface PackageCardProps {
  packageName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icons: any[];
  selected: boolean;
  onChange?(included: boolean): void;
  children: React.ReactNode;
  alwaysIncluded?: boolean;
}

const PackageCard = (props: PackageCardProps): JSX.Element => {
  // const [included, setIncluded] = useState(props.selected);
  const included = props.selected;
  const toggleIncluded = (): void => {
    if (props.onChange) {
      props.onChange(!included);
    }
  };
  const cardCss = props.alwaysIncluded
    ? styles['package-card-included']
    : styles['package-card-optional'];
  const plusSvg = dataUriToSrc(Plus);
  const checkSvg = dataUriToSrc(Check);
  return (
    <div className={`card card-frame h-100 ${cardCss}`}>
      <div className="card-body">
        <div className="media">
          <div className="avatar avatar-xs mt-1 mr-3">
            {props.icons.map((icon, index) => {
              return (
                <img key={index} className="avatar-img" src={icon} alt="" />
              );
            })}
          </div>
          <div className="media-body">
            <div className="d-flex align-items-center">
              <span className="d-block text-dark font-weight-bold">
                {props.packageName}
              </span>
            </div>
            <span className={`d-block text-body ${styles['feature-list']}`}>
              {props.children}
            </span>
          </div>
        </div>
      </div>
      {!included && !props.alwaysIncluded && (
        <div
          className={`card-footer btn btn-primary btn-sm ${styles['include-footer']}`}
          onClick={toggleIncluded}
        >
          <span
            className={styles['icon']}
            dangerouslySetInnerHTML={{ __html: plusSvg }}
          ></span>
          Add to Project
        </div>
      )}
      {included && !props.alwaysIncluded && (
        <div
          className={`card-footer btn btn-success btn-sm ${styles['included-footer']}`}
          onClick={toggleIncluded}
        >
          <span
            className={styles['icon']}
            dangerouslySetInnerHTML={{ __html: checkSvg }}
          ></span>
          Included in Project
        </div>
      )}
      {props.alwaysIncluded && false && (
        <div
          className={`card-footer text-center btn-sm ${styles['always-included-footer']}`}
        >
          <span
            className={styles['icon']}
            dangerouslySetInnerHTML={{ __html: checkSvg }}
          ></span>
          Included in Project
        </div>
      )}
    </div>
  );
};

export default PackageCard;
