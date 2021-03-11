import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import ReactModal from 'react-modal';

import TVLLoader from './TVLLoader/TVLLoader';
import { useConnectWallet } from '../../../home/redux/hooks';
import { useFetchBalances, useFetchVaultsData, useFetchApys } from '../../redux/hooks';
import VisiblePools from '../VisiblePools/VisiblePools';
import styles from './styles';
import usePoolsTvl from '../../hooks/usePoolsTvl';
import { formatGlobalTvl } from 'features/helpers/format';
import { useFetchPoolsInfo } from '../../../stake/redux/fetchPoolsInfo';

const FETCH_INTERVAL_MS = 30 * 1000;

const useStyles = makeStyles(styles);

export default function Pools() {
  const { t } = useTranslation();
  const { web3, address } = useConnectWallet();
  const [isOpen, setIsOpen] = useState(false);
  const { pools, fetchVaultsData, fetchVaultsDataDone } = useFetchVaultsData();
  const { poolsInfo, fetchPoolsInfo } = useFetchPoolsInfo();
  const { tokens, fetchBalances, fetchBalancesDone } = useFetchBalances();
  const { apys, fetchApys, fetchApysDone } = useFetchApys();
  const { poolsTvl } = usePoolsTvl(pools);
  const classes = useStyles();

  useEffect(() => {
    fetchPoolsInfo();
  }, [fetchPoolsInfo]);

  useEffect(() => {
    if (address && web3) {
      const fetch = () => {
        fetchBalances({ address, web3, tokens });
        fetchVaultsData({ address, web3, pools });
        fetchApys();
      };
      fetch();

      const id = setInterval(fetch, FETCH_INTERVAL_MS);
      return () => clearInterval(id);
    }

    // Adding tokens and pools to this dep list, causes an endless loop, DDoSing the api
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, web3, fetchBalances, fetchVaultsData]);

  return (
    <Grid container className={classes.container}>
      <Grid item xs={6}>
        <h1 className={classes.title}>Network</h1>
        <ReactModal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} />
        <div
          className={classes.networkToggle}
          onClick={() => {
            setIsOpen(true);
          }}
          style={{
            content: { zIndex: '1500' },
          }}
        >
          <img
            className={classes.networkImg}
            src={require('../../../../images/single-assets/BNB.png')}
          ></img>
          <div className={classes.networkTag}>
            <div className={classes.status}></div>
            <p className={classes.networkText}>BSC Mainnet</p>
          </div>
        </div>
      </Grid>
      <Grid item xs={6}>
        <div className={classes.tvl}>
          <h1 className={classes.title}>
            TVL{' '}
            {fetchVaultsDataDone && poolsTvl > 0 ? (
              formatGlobalTvl(poolsTvl)
            ) : (
              <TVLLoader className={classes.titleLoader} />
            )}
          </h1>
          <h3 className={classes.subtitle}>{t('Vault-WithdrawFee')}</h3>
        </div>
      </Grid>

      <VisiblePools
        pools={pools}
        poolsInfo={poolsInfo}
        apys={apys}
        tokens={tokens}
        fetchBalancesDone={fetchBalancesDone}
        fetchApysDone={fetchApysDone}
        fetchVaultsDataDone={fetchVaultsDataDone}
      />
    </Grid>
  );
}
