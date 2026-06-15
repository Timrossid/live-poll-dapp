import { useState, useCallback, useRef } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
} from '@stellar/stellar-wallets-kit';
import { WalletNotFoundError, UserRejectedError } from '../utils/contract';

let kitInstance: StellarWalletsKit | null = null;

function getKit(): StellarWalletsKit {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({
      modules: allowAllModules(),
      network: WalletNetwork.TESTNET,
    });
  }
  return kitInstance;
}

export type TxSigner = (xdr: string) => Promise<string>;

export function useWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const kitRef = useRef(getKit());

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setWalletError(null);

    try {
      const kit = kitRef.current;

      const { address } = await kit.openModal({
        onError: (error) => {
          if (error?.message?.includes('reject') || error?.message?.includes('cancelled') || error?.message?.includes('closed')) {
            throw new UserRejectedError();
          }
          throw error;
        },
      });

      if (!address) {
        throw new UserRejectedError();
      }

      setPublicKey(address);
      return address;
    } catch (err: any) {
      if (err instanceof UserRejectedError) {
        setWalletError('Connection was rejected. Please try again.');
      } else if (
        err.message?.includes('wallet') ||
        err.message?.includes('install') ||
        err.message?.includes('not found') ||
        err.message?.includes('module')
      ) {
        setWalletError(
          'No Stellar wallet detected. Please install Freighter or Lobstr wallet extension.'
        );
        throw new WalletNotFoundError();
      } else {
        setWalletError(err.message || 'Failed to connect wallet');
      }
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await kitRef.current.disconnect();
    } catch {
      // ignore disconnect errors
    }
    setPublicKey(null);
    setWalletError(null);
  }, []);

  const signTransaction: TxSigner = useCallback(async (xdr: string) => {
    const kit = kitRef.current;
    const { signedTxXdr } = await kit.signTransaction(xdr, {
      network: WalletNetwork.TESTNET,
    });
    return signedTxXdr;
  }, []);

  return {
    publicKey,
    isConnecting,
    walletError,
    setWalletError,
    connect,
    disconnect,
    signTransaction,
    kit: kitRef.current,
  };
}
