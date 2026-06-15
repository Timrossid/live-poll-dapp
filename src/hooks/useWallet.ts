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
      let resolved = false;

      const address = await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          if (!resolved) reject(new Error('Connection timed out'));
        }, 60000);

        let walletSelected = false;

        kit.openModal({
          onWalletSelected: async (wallet) => {
            walletSelected = true;
            kit.setWallet(wallet.id);

            try {
              const { address } = await kit.getAddress();
              clearTimeout(timer);
              resolved = true;
              resolve(address);
            } catch (e) {
              reject(e);
            }
          },
          onClosed: (err) => {
            if (resolved) return;
            clearTimeout(timer);

            if (err) {
              const msg = err.message?.toLowerCase() || '';
              if (msg.includes('reject') || msg.includes('cancelled') || msg.includes('closed')) {
                return reject(new UserRejectedError());
              }
              return reject(err);
            }

            if (!walletSelected) {
              return reject(new UserRejectedError());
            }

            reject(new Error('Wallet connection was interrupted'));
          },
        });
      });

      setPublicKey(address);
      return address;
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';

      if (err instanceof UserRejectedError || msg.includes('reject') || msg.includes('cancelled') || msg.includes('closed')) {
        setWalletError('Connection was rejected. Please try again.');
      } else if (msg.includes('wallet') || msg.includes('install') || msg.includes('not found') || msg.includes('module') || msg.includes('available')) {
        setWalletError('No Stellar wallet detected. Please install Freighter or Lobstr wallet extension.');
      } else if (msg.includes('timeout')) {
        setWalletError('Connection timed out. Please try again.');
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
      // ignore
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
