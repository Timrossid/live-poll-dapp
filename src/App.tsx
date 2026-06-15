import { useState } from 'react';
import { useWallet } from './hooks/useWallet';
import { usePoll } from './hooks/usePoll';
import { WalletConnect } from './components/WalletConnect';
import { PollQuestion } from './components/PollQuestion';
import { PollOptions } from './components/PollOptions';
import { ResultsChart } from './components/ResultsChart';
import { TransactionStatus } from './components/TransactionStatus';
import './App.css';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || '';

export default function App() {
  const { publicKey, isConnecting, walletError, setWalletError, connect, disconnect, signTransaction } = useWallet();
  const { pollData, isLoadingPoll, pollError, setPollError, isVoting, voteStatus, submitVote, refresh } = usePoll(CONTRACT_ID, publicKey);
  const [contractInput, setContractInput] = useState(CONTRACT_ID);

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      // error is handled in hook
    }
  };

  const handleVote = async (optionIndex: number) => {
    try {
      await submitVote(optionIndex, signTransaction);
    } catch {
      // error is handled in hook
    }
  };

  const handleContractChange = () => {
    const input = (document.getElementById('contract-input') as HTMLInputElement).value;
    setContractInput(input);
    refresh();
  };

  const isEditable = !import.meta.env.VITE_CONTRACT_ID;

  return (
    <div className="app">
      <header className="header">
        <h1>Live Poll dApp</h1>
        <p>Real-time voting on Stellar testnet using Soroban smart contracts</p>
        <WalletConnect
          publicKey={publicKey}
          isConnecting={isConnecting}
          walletError={walletError}
          onConnect={handleConnect}
          onDisconnect={disconnect}
        />
      </header>

      <main className="main">
        {!publicKey ? (
          <div className="connect-prompt">
            <h2>Welcome to Live Poll</h2>
            <p>Connect your Stellar wallet to participate in live polling.</p>
            <div className="supported-wallets">
              <h3>Supported Wallets:</h3>
              <ul>
                <li>Freighter</li>
                <li>Lobstr</li>
                <li>Albedo</li>
                <li>xBull</li>
                <li>WalletConnect</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <section className="poll-section">
              {isEditable && (
                <div className="contract-input-group">
                  <input
                    id="contract-input"
                    type="text"
                    defaultValue={contractInput}
                    placeholder="Enter contract ID"
                    className="contract-input"
                  />
                  <button className="btn btn-secondary" onClick={handleContractChange}>
                    Load Poll
                  </button>
                </div>
              )}

              {pollError && !pollData && (
                <div className="error-message">{pollError}</div>
              )}

              {pollData && (
                <>
                  <PollQuestion
                    question={pollData.question}
                    totalVoters={pollData.totalVoters}
                    isLoading={isLoadingPoll}
                  />

                  <div className="poll-content">
                    <div className="poll-column">
                      <PollOptions
                        options={pollData.options}
                        votes={pollData.votes}
                        hasVoted={pollData.hasVoted}
                        isVoting={isVoting}
                        onVote={handleVote}
                      />
                    </div>
                    <div className="poll-column">
                      <ResultsChart
                        options={pollData.options}
                        votes={pollData.votes}
                        totalVoters={pollData.totalVoters}
                      />
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="status-section">
              <TransactionStatus
                hash={voteStatus.hash}
                status={voteStatus.status}
                isVoting={isVoting}
                error={pollError}
                onDismissError={() => setPollError(null)}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
