import { useState, useCallback, useRef } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
} from '@creit.tech/stellar-wallets-kit';
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

      const { address } = await new Promise<{ address: string }>((resolve, reject) => {
        let walletId = '';

        kit.openModal({
          onWalletSelected: (wallet) => {
            walletId = wallet.id;
            kit.setWallet(wallet.id);
          },
          onClosed: (err) => {
            if (err) {
              const msg = err.message?.toLowerCase() || '';
              if (msg.includes('reject') || msg.includes('cancelled') || msg.includes('closed')) {
                return reject(new UserRejectedError());
              }
              return reject(err);
            }
            if (!walletId) {
              return reject(new UserRejectedError());
            }
            kit.getAddress({ skipRequestAccess: true }).then(resolve).catch(reject);
          },
        });
      });

      setPublicKey(address);
      return address;
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';

      if (err instanceof UserRejectedError) {
        setWalletError('Connection was rejected. Please try again.');
        throw err;
      }

      if (
        msg.includes('reject') ||
        msg.includes('cancelled') ||
        msg.includes('closed')
      ) {
        setWalletError('Connection was rejected. Please try again.');
        throw new UserRejectedError();
      }

      if (
        msg.includes('wallet') ||
        msg.includes('install') ||
        msg.includes('not found') ||
        msg.includes('module') ||
        msg.includes('available')
      ) {
        setWalletError(
          'No Stellar wallet detected. Please install Freighter or Lobstr wallet extension.'
        );
        throw new WalletNotFoundError();
      }

      setWalletError(err.message || 'Failed to connect wallet');
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
      networkPassphrase: WalletNetwork.TESTNET,
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
