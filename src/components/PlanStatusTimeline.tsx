import React, { useState, useMemo } from 'react';
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

/* ─── Components ────────────────────────────────────────────── */

const EventIcon = ({ type }: { type: TimelineEventType }) => {
    const iconSize = 16;
    switch (type) {
        case 'Created': return <PlusCircle size={iconSize} color="#94a3b8" />;
        case 'Activated': return <PlayCircle size={iconSize} color="#34d399" />;
        case 'Paused': return <PauseCircle size={iconSize} color="#fbbf24" />;
        case 'Resumed': return <RefreshCw size={iconSize} color="#60a5fa" />;
        case 'Cancelled': return <XCircle size={iconSize} color="#fb7185" />;
        case 'Payment': return <CreditCard size={iconSize} color="#818cf8" />;
        default: return <PlusCircle size={iconSize} color="#94a3b8" />;
    }
};

const TimelineFilterChips = ({ 
    activeFilter, 
    setFilter 
}: { 
    activeFilter: string, 
    setFilter: (f: string) => void 
}) => {
    const filters = [
        { label: 'All', value: 'All' },
        { label: 'Payments', value: 'Payment' },
        { label: 'Status Changes', value: 'Status' },
        { label: 'Pauses', value: 'Paused' },
        { label: 'Cancellations', value: 'Cancelled' }
    ];

    return (
        <div 
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} 
            role="group" 
            aria-label="Filter timeline events"
        >
            {filters.map(filter => (
                <button
                    key={filter.value}
                    onClick={() => setFilter(filter.value)}
                    aria-pressed={activeFilter === filter.value}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '100px',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        backgroundColor: activeFilter === filter.value ? '#00D3F3' : 'rgba(31, 41, 55, 0.5)',
                        color: activeFilter === filter.value ? '#000' : '#94a3b8',
                        border: '1px solid',
                        borderColor: activeFilter === filter.value ? '#00D3F3' : 'rgba(71, 85, 105, 0.3)',
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
    event: TimelineEvent, 
    isLast: boolean 
}) => {
    return (
        <li style={{ position: 'relative', paddingLeft: '2rem', paddingBottom: isLast ? '0' : '2rem' }} role="listitem">
            {/* Timeline Connector */}
            {!isLast && (
                <div 
                    style={{ 
                        position: 'absolute', 
                        left: '9px', 
                        top: '1.5rem', 
                        bottom: '0', 
                        width: '2px', 
                        backgroundColor: '#1e293b' 
                    }} 
                    aria-hidden="true"
                />
            )}
            
            {/* Timeline Dot/Icon */}
            <div 
                style={{ 
                    position: 'absolute', 
                    left: '0', 
                    top: '0', 
                    width: '20px', 
                    height: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    zIndex: 10,
                    backgroundColor: '#0a0a0a',
                    borderRadius: '50%',
                    transform: 'translateY(2px)'
                }}
            >
                <EventIcon type={event.type} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                        {event.status}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {event.timestamp}
                    </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                        {event.actor === 'System' ? (
                            <Cpu size={12} color="#64748b" />
                        ) : (
                            <User size={12} color="#64748b" />
                        )}
                        <span>{event.actor || 'System'}</span>
                    </div>
                </div>

                {event.details && (
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', lineHeight: '1.4', margin: '4px 0 0' }}>
                        {event.details}
                    </p>
                )}
            </div>
        </li>
    );
};

export default function PlanStatusTimeline({ 
    subscriptionId, 
    events = MOCK_EVENTS 
}: PlanStatusTimelineProps) {
    const [filter, setFilter] = useState('All');
    const [isExpanded, setIsExpanded] = useState(false);
    const INITIAL_COUNT = 3;

    const filteredEvents = useMemo(() => {
        if (filter === 'All') return events;
        if (filter === 'Status') {
            return events.filter(e => e.type !== 'Payment');
        }
        return events.filter(e => e.type === filter);
    }, [events, filter]);

    const displayedEvents = isExpanded ? filteredEvents : filteredEvents.slice(0, INITIAL_COUNT);
    const hasMore = filteredEvents.length > INITIAL_COUNT;

    return (
        <div style={{
            background: '#0a0a0a',
            borderRadius: '12px',
            border: '1px solid #1f2937',
            padding: '1.5rem',
            fontFamily: 'Inter, sans-serif',
            marginTop: '2rem'
        }}>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '1.5rem',
                marginBottom: '1.5rem' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: '#1f2937',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <RefreshCw size={16} color="#9ca3af" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                        Plan Status History
                    </h2>
                </div>

                <TimelineFilterChips 
                    activeFilter={filter} 
                    setFilter={setFilter} 
                />
            </div>

            {filteredEvents.length > 0 ? (
                <>
                    <ol 
                        style={{ listStyle: 'none', padding: 0, margin: 0 }} 
                        aria-label="Plan status timeline"
                    >
                        {displayedEvents.map((event, index) => (
                            <TimelineItem 
                                key={event.id} 
                                event={event} 
                                isLast={index === displayedEvents.length - 1} 
                            />
                        ))}
                    </ol>

                    {hasMore && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: '#00D3F3',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                padding: '8px 0',
                                marginTop: '8px',
                                outline: 'none'
                            }}
                        >
                            {isExpanded ? (
                                <>Show less <ChevronUp size={16} /></>
                            ) : (
                                <>Show {filteredEvents.length - INITIAL_COUNT} more events <ChevronDown size={16} /></>
                            )}
                        </button>
                    )}
                </>
            ) : (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem 0', 
                    color: '#64748b',
                    fontSize: '14px'
                }}>
                    No events found for this filter.
                </div>
            )}
        </div>
    );
}
