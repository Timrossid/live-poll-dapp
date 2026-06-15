interface PollQuestionProps {
  question: string;
  totalVoters: number;
  isLoading: boolean;
}

export function PollQuestion({ question, totalVoters, isLoading }: PollQuestionProps) {
  if (isLoading && !question) {
    return (
      <div className="poll-question">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />
      </div>
    );
  }

  return (
    <div className="poll-question">
      <h2 className="question-title">{question}</h2>
      <p className="total-voters">Total votes: {totalVoters}</p>
    </div>
  );
}
