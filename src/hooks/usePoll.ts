import { useState, useEffect, useCallback, useRef } from 'react';
import { getPollData, castVote, PollData, InsufficientBalanceError, UserRejectedError } from '../utils/contract';
import { TxSigner } from './useWallet';
import { getBalance } from '../utils/stellar';

const POLL_INTERVAL_MS = 5000;

export function usePoll(contractId: string, publicKey: string | null) {
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [isLoadingPoll, setIsLoadingPoll] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteStatus, setVoteStatus] = useState<{
    hash?: string;
    status: 'pending' | 'success' | 'failed' | null;
  }>({ status: null });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPoll = useCallback(async () => {
    if (!publicKey || !contractId) return;

    try {
      const data = await getPollData(contractId, publicKey);
      setPollData(data);
      setPollError(null);
    } catch (err: any) {
      if (err.message?.includes('MissingData')) {
        setPollError('Poll not initialized on this contract.');
      } else {
        setPollError(err.message || 'Failed to load poll data');
      }
    }
  }, [contractId, publicKey]);

  useEffect(() => {
    fetchPoll();

    if (contractId && publicKey) {
      intervalRef.current = setInterval(fetchPoll, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPoll, contractId, publicKey]);

  const submitVote = useCallback(
    async (optionIndex: number, signTransaction: TxSigner) => {
      if (!publicKey || !contractId) {
        setPollError('Wallet not connected');
        return;
      }

      setIsVoting(true);
      setVoteStatus({ status: 'pending' });

      try {
        const result = await castVote(
          contractId,
          publicKey,
          optionIndex,
          signTransaction
        );

        setVoteStatus({ hash: result.hash, status: result.status });

        if (result.status === 'success') {
          await fetchPoll();
        }

        return result;
      } catch (err: any) {
        if (err instanceof InsufficientBalanceError) {
          setPollError(err.message);
        } else if (err instanceof UserRejectedError) {
          setPollError('Vote was cancelled.');
        } else {
          setPollError(err.message || 'Vote failed');
        }
        setVoteStatus({ status: 'failed' });
        throw err;
      } finally {
        setIsVoting(false);
      }
    },
    [contractId, publicKey, fetchPoll]
  );

  return {
    pollData,
    isLoadingPoll,
    pollError,
    setPollError,
    isVoting,
    voteStatus,
    submitVote,
    refresh: fetchPoll,
  };
}
