import { useCallback, useMemo, useState } from 'react';
import joinClasses from './utils/joinClasses';

type Option = { text: string; uid: string; votes: string[] };

export default function HydratedPoll({ question, options }: { question: string; options: Option[] }) {
    const [opts, setOpts] = useState<Option[] | null>(() => (Array.isArray(options) ? options.map((o) => ({ ...o })) : []));

    const totalVotes = useMemo(() => (opts ? opts.reduce((s, o) => s + (o.votes?.length || 0), 0) : 0), [opts]);

    const toggleVote = useCallback((uid: string) => {
        setOpts((prev) => {
            if (!prev) return prev;
            return prev.map((o) => {
                if (o.uid !== uid) return o;
                const votes = new Set(o.votes || []);
                const fakeUser = 'visitor';
                if (votes.has(fakeUser)) votes.delete(fakeUser);
                else votes.add(fakeUser);
                return { ...o, votes: Array.from(votes) };
            });
        });
    }, []);

    if (!opts) return null;

    return (
        <div className="PollNode__container">
            <div className="PollNode__inner">
                <h2 className="PollNode__heading">{question}</h2>
                {opts.map((opt) => (
                    <div key={opt.uid} className="PollNode__optionContainer">
                        <div className={joinClasses('PollNode__optionCheckboxWrapper')}>
                            <input
                                type="checkbox"
                                className="PollNode__optionCheckbox"
                                checked={(opt.votes || []).length > 0}
                                onChange={() => toggleVote(opt.uid)}
                            />
                        </div>
                        <div className="PollNode__optionInputWrapper">
                            <div
                                className="PollNode__optionInputVotes"
                                style={{ width: `${totalVotes === 0 ? 0 : ((opt.votes?.length || 0) / totalVotes) * 100}%` }}
                            />
                            <span className="PollNode__optionInputVotesCount">
                                {(opt.votes?.length || 0) > 0 ? ((opt.votes?.length === 1 ? '1 vote' : `${opt.votes?.length} votes`)) : ''}
                            </span>
                            <input className="PollNode__optionInput" type="text" value={opt.text} readOnly />
                        </div>
                    </div>
                ))}
                <div className="PollNode__footer" />
            </div>
        </div>
    );
}
