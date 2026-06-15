interface ResultsChartProps {
  options: string[];
  votes: Record<number, number>;
  totalVoters: number;
}

export function ResultsChart({ options, votes, totalVoters }: ResultsChartProps) {
  const maxVotes = Math.max(...Object.values(votes), 1);

  if (options.length === 0) {
    return (
      <div className="results-chart">
        <p className="no-data">No results yet</p>
      </div>
    );
  }

  return (
    <div className="results-chart">
      <h3>Live Results</h3>
      <div className="chart-container">
        {options.map((option, index) => {
          const voteCount = votes[index] || 0;
          const barHeight = maxVotes > 0 ? (voteCount / maxVotes) * 200 : 0;
          const percentage = totalVoters > 0 ? (voteCount / totalVoters) * 100 : 0;

          return (
            <div key={index} className="chart-bar-group">
              <div className="chart-bar-wrapper">
                <div
                  className="chart-bar"
                  style={{ height: `${barHeight}px` }}
                >
                  <span className="chart-bar-count">{voteCount}</span>
                </div>
              </div>
              <div className="chart-label" title={option}>
                {option.length > 12 ? option.slice(0, 12) + '...' : option}
              </div>
              <div className="chart-percentage">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
