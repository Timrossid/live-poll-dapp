interface WalletConnectProps {
  publicKey: string | null;
  isConnecting: boolean;
  walletError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({
  publicKey,
  isConnecting,
  walletError,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  return (
    <div className="wallet-connect">
      {publicKey ? (
        <div className="wallet-connected">
          <div className="wallet-info">
            <span className="wallet-label">Connected</span>
            <span className="wallet-address">
              {publicKey.slice(0, 8)}...{publicKey.slice(-4)}
            </span>
          </div>
          <button className="btn btn-secondary" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className={`btn btn-primary ${isConnecting ? 'loading' : ''}`}
          onClick={onConnect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      {walletError && (
        <div className="error-message">
          <span className="error-icon">!</span>
          {walletError}
        </div>
      )}
    </div>
  );
}
