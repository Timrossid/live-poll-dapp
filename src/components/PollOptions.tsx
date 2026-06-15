interface PollOptionsProps {
  options: string[];
  votes: Record<number, number>;
  hasVoted: boolean;
  isVoting: boolean;
  onVote: (optionIndex: number) => void;
}

export function PollOptions({
  options,
  votes,
  hasVoted,
  isVoting,
  onVote,
}: PollOptionsProps) {
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  if (options.length === 0) {
    return (
      <div className="poll-options">
        <p className="no-data">No options available</p>
      </div>
    );
  }

  return (
    <div className="poll-options">
      <h3>Options</h3>
      <div className="options-list">
        {options.map((option, index) => {
          const voteCount = votes[index] || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

          return (
            <div key={index} className="option-item">
              <div className="option-row">
                <span className="option-name">{option}</span>
                <span className="option-count">
                  {voteCount} vote{voteCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="option-row secondary">
                <span className="option-percentage">{percentage.toFixed(1)}%</span>
                {!hasVoted && (
                  <button
                    className="btn btn-vote"
                    onClick={() => onVote(index)}
                    disabled={isVoting}
                  >
                    {isVoting ? 'Voting...' : 'Vote'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
