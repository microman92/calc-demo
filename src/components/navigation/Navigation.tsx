import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navigation.module.scss';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    {
      category: 'Pipes',
      items: [
        { path: '/pipes/heat-loss', label: 'Heat Loss Calculation for Pipes' },
        { path: '/pipes/condensation', label: 'Condensation Prevention for Pipes' },
      ]
    },
    {
      category: 'Sheets',
      items: [
        { path: '/sheets/heat-loss', label: 'Heat Loss Calculation for Sheets' },
        { path: '/sheets/condensation', label: 'Condensation Prevention for Sheets' },
      ]
    }
  ];

  return (
    <nav className={styles.navigation}>
      <div className={styles.navigation__container}>
        <div className={styles.navigation__header}>
          <h1 className={styles.navigation__header_title}>ROKAFLEX Calculators</h1>
          <p className={styles.navigation__header_subtitle}>Thermal insulation and condensation prevention calculations</p>
        </div>

        <div className={styles.navigation__content}>
          {navigationItems.map((category) => (
            <div key={category.category} className={styles.navigation__category}>
              <h2 className={styles.navigation__category_title}>{category.category}</h2>
              <div className={styles.navigation__category_items}>
                {category.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.navigation__item} ${
                      location.pathname === item.path ? styles['navigation__item_active'] : ''
                    }`}
                  >
                    <div className={styles.navigation__item_content}>
                      <h3 className={styles.navigation__item_title}>{item.label}</h3>
                      <p className={styles.navigation__item_description}>
                        {item.path.includes('heat-loss') 
                          ? 'Calculation of heat losses and economic efficiency of insulation'
                          : 'Determination of minimum insulation thickness to prevent condensation'
                        }
                      </p>
                    </div>
                    <div className={styles.navigation__item_arrow}>→</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
