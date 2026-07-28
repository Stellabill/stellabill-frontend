import React, { useMemo, useState } from 'react';
import {
    PlusCircle,
    PlayCircle,
    PauseCircle,
    RefreshCw,
    XCircle,
    User,
    Cpu,
    ChevronDown,
    ChevronUp,
    CreditCard
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */

export type TimelineEventType = 'Created' | 'Activated' | 'Paused' | 'Resumed' | 'Cancelled' | 'Payment';

export interface TimelineEvent {
    id: string;
    type: TimelineEventType;
    status: string;
    actor?: string;
    timestamp: string;
    details?: string;
}

interface PlanStatusTimelineProps {
    subscriptionId?: string;
    events?: TimelineEvent[];
}

/* ─── Mock Data ─────────────────────────────────────────────── */

const MOCK_EVENTS: TimelineEvent[] = [
    {
        id: '1',
        type: 'Created',
        status: 'Subscription created',
        actor: 'Chukwuemeka',
        timestamp: 'Feb 10, 2026, 10:30 AM'
    },
    {
        id: '2',
        type: 'Activated',
        status: 'Plan activated',
        actor: 'System',
        timestamp: 'Feb 10, 2026, 10:31 AM'
    },
    {
        id: '3',
        type: 'Payment',
        status: 'Payment successful',
        actor: 'System',
        timestamp: 'Feb 15, 2026, 09:00 AM',
        details: '10 USDC - Period: Feb 15 - Mar 15'
    },
    {
        id: '4',
        type: 'Paused',
        status: 'Subscription paused',
        actor: 'Chukwuemeka',
        timestamp: 'Mar 01, 2026, 02:45 PM',
        details: 'User requested pause due to travel'
    },
    {
        id: '5',
        type: 'Resumed',
        status: 'Subscription resumed',
        actor: 'Chukwuemeka',
        timestamp: 'Mar 10, 2026, 11:20 AM'
    },
    {
        id: '6',
        type: 'Payment',
        status: 'Payment successful',
        actor: 'System',
        timestamp: 'Mar 15, 2026, 09:00 AM',
        details: '10 USDC - Period: Mar 15 - Apr 15'
    },
    {
        id: '7',
        type: 'Cancelled',
        status: 'Subscription cancelled',
        actor: 'Chukwuemeka',
        timestamp: 'Mar 20, 2026, 04:15 PM',
        details: 'End of contract'
    }
];

const EVENT_FILTERS = [
    { label: 'All activity', value: 'All' },
    { label: 'User actions', value: 'User' },
    { label: 'System events', value: 'System' },
    { label: 'Payments', value: 'Payment' }
];

const EventIcon = ({ type }: { type: TimelineEventType }) => {
    const iconSize = 16;
    switch (type) {
        case 'Created':
            return <PlusCircle size={iconSize} color="#94a3b8" />;
        case 'Activated':
            return <PlayCircle size={iconSize} color="#34d399" />;
        case 'Paused':
            return <PauseCircle size={iconSize} color="#fbbf24" />;
        case 'Resumed':
            return <RefreshCw size={iconSize} color="#60a5fa" />;
        case 'Cancelled':
            return <XCircle size={iconSize} color="#fb7185" />;
        case 'Payment':
            return <CreditCard size={iconSize} color="#818cf8" />;
        default:
            return <PlusCircle size={iconSize} color="#94a3b8" />;
    }
};

const TimelineFilterChips = ({
    activeFilter,
    setFilter
}: {
    activeFilter: string;
    setFilter: (filter: string) => void;
}) => {
    return (
        <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
            role="group"
            aria-label="Filter timeline events"
        >
            {EVENT_FILTERS.map((filter) => (
                <button
                    key={filter.value}
                    type="button"
                    onClick={() => setFilter(filter.value)}
                    aria-pressed={activeFilter === filter.value}
                    style={{
                        padding: '0.55rem 1rem',
                        borderRadius: '999px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        backgroundColor: activeFilter === filter.value ? '#00D3F3' : 'rgba(31, 41, 55, 0.6)',
                        color: activeFilter === filter.value ? '#000' : '#cbd5e1',
                        border: '1px solid',
                        borderColor: activeFilter === filter.value ? '#00D3F3' : 'rgba(71, 85, 105, 0.35)',
                        cursor: 'pointer',
                        outline: 'none'
                    }}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
};

const TimelineItem = ({
    event,
    isLast
}: {
    event: TimelineEvent;
    isLast: boolean;
}) => {
    return (
        <li style={{ position: 'relative', paddingLeft: '2.4rem', paddingBottom: isLast ? 0 : '2rem' }} role="listitem">
            {!isLast && (
                <div
                    style={{
                        position: 'absolute',
                        left: '14px',
                        top: '1.6rem',
                        bottom: 0,
                        width: '2px',
                        backgroundColor: '#1e293b'
                    }}
                    aria-hidden="true"
                />
            )}

            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    backgroundColor: '#0a0a0a',
                    borderRadius: '50%',
                    transform: 'translateY(4px)'
                }}
            >
                <EventIcon type={event.type} />
            </div>

            <div style={{ display: 'grid', gap: '0.45rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline' }}>
                    <p style={{ margin: 0, fontSize: '0.96rem', fontWeight: 600, color: '#f8fafc' }}>{event.status}</p>
                    <time style={{ fontSize: '0.82rem', color: '#64748b' }} dateTime={new Date(event.timestamp).toISOString()}>
                        {event.timestamp}
                    </time>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', color: '#94a3b8' }}>
                        {event.type === 'Payment' ? (
                            <CreditCard size={14} color="#64748b" />
                        ) : event.actor === 'System' ? (
                            <Cpu size={14} color="#64748b" />
                        ) : (
                            <User size={14} color="#64748b" />
                        )}
                        <span>{event.actor || 'System'}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', background: '#111827', borderRadius: '999px', padding: '4px 10px' }}>
                        {event.type}
                    </span>
                </div>

                {event.details && (
                    <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.92rem', color: '#94a3b8' }}>{event.details}</p>
                )}
            </div>
        </li>
    );
};

function formatDay(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function isEventVisible(event: TimelineEvent, filter: string) {
    if (filter === 'All') return true;
    if (filter === 'Payment') return event.type === 'Payment';
    if (filter === 'System') return event.actor === 'System' && event.type !== 'Payment';
    if (filter === 'User') return event.actor !== 'System';
    return true;
}

export default function PlanStatusTimeline({
    subscriptionId,
    events = MOCK_EVENTS
}: PlanStatusTimelineProps) {
    const [filter, setFilter] = useState('All');
    const [isExpanded, setIsExpanded] = useState(false);
    const INITIAL_COUNT = 3;

    const filteredEvents = useMemo(() => {
        const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return sortedEvents.filter((event) => isEventVisible(event, filter));
    }, [events, filter]);

    const visibleEvents = isExpanded ? filteredEvents : filteredEvents.slice(0, INITIAL_COUNT);

    const groupedEvents = useMemo(() => {
        return visibleEvents.reduce<Record<string, TimelineEvent[]>>((groups, event) => {
            const day = formatDay(event.timestamp);
            if (!groups[day]) groups[day] = [];
            groups[day].push(event);
            return groups;
        }, {});
    }, [visibleEvents]);

    const groupKeys = Object.keys(groupedEvents);
    const hasMore = !isExpanded && filteredEvents.length > INITIAL_COUNT;

    return (
        <div style={{
            background: '#0a0a0a',
            borderRadius: '18px',
            border: '1px solid #1f2937',
            padding: '1.5rem',
            fontFamily: 'Inter, sans-serif',
            marginTop: '2rem'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: '#111827',
                        padding: '0.5rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <RefreshCw size={16} color="#9ca3af" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                            Subscription activity timeline
                        </h2>
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>
                            Grouped by day with event type filters and older activity loading.
                        </p>
                    </div>
                </div>

                <TimelineFilterChips
                    activeFilter={filter}
                    setFilter={(value) => {
                        setFilter(value);
                        setIsExpanded(false);
                    }}
                />
            </div>

            {filteredEvents.length > 0 ? (
                <div aria-label="Subscription activity timeline">
                    {groupKeys.map((day, dayIndex) => (
                        <section key={day} aria-labelledby={`timeline-day-${dayIndex}`} style={{ marginBottom: '1.75rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }} id={`timeline-day-${dayIndex}`}>
                                    {day}
                                </h3>
                                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{groupedEvents[day].length} event{groupedEvents[day].length > 1 ? 's' : ''}</span>
                            </div>
                            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                {groupedEvents[day].map((event, index) => (
                                    <TimelineItem
                                        key={event.id}
                                        event={event}
                                        isLast={index === groupedEvents[day].length - 1 && dayIndex === groupKeys.length - 1}
                                    />
                                ))}
                            </ol>
                        </section>
                    ))}

                    {hasMore ? (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                color: '#60a5fa',
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                            aria-expanded={isExpanded}
                        >
                            Load older activity
                            <ChevronDown size={16} />
                        </button>
                    ) : (
                        filteredEvents.length > INITIAL_COUNT && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(false)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    color: '#60a5fa',
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                                aria-expanded={isExpanded}
                            >
                                Show less
                                <ChevronUp size={16} />
                            </button>
                        )
                    )}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b', fontSize: '0.95rem' }}>
                    No events found for this filter.
                </div>
            )}
        </div>
    );
}
