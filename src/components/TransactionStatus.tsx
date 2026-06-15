const STELLAR_EXPLORER = 'https://stellar.expert/explorer/testnet/tx';

interface TransactionStatusProps {
  hash: string | undefined;
  status: 'pending' | 'success' | 'failed' | null;
  isVoting: boolean;
  error: string | null;
  onDismissError: () => void;
}

export function TransactionStatus({
  hash,
  status,
  isVoting,
  error,
  onDismissError,
}: TransactionStatusProps) {
  return (
    <div className="transaction-status">
      {isVoting && status === 'pending' && (
        <div className="status-pending">
          <div className="spinner" />
          <span>Transaction pending... Please sign with your wallet.</span>
        </div>
      )}

      {status === 'pending' && !isVoting && (
        <div className="status-pending">
          <div className="spinner" />
          <span>Waiting for confirmation...</span>
        </div>
      )}

      {status === 'success' && hash && (
        <div className="status-success">
          <span className="status-icon">&#10003;</span>
          <div className="status-content">
            <span>Vote cast successfully!</span>
            <a
              href={`${STELLAR_EXPLORER}/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              View on Explorer &rarr;
            </a>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="status-failed">
          <span className="status-icon">&#10007;</span>
          <span>Transaction failed on the network.</span>
        </div>
      )}

      {error && (
        <div className="error-message dismissable">
          <span className="error-icon">!</span>
          <span>{error}</span>
          <button className="btn-dismiss" onClick={onDismissError}>
            &times;
          </button>
        </div>
      )}

      {!isVoting && !status && !error && (
        <p className="status-idle">
          Connect your wallet and cast your vote to see transaction status here.
        </p>
      )}
    </div>
  );
}
