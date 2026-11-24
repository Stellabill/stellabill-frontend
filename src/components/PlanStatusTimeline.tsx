import { useMemo, useState } from 'react';
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
import styles from './PlanStatusTimeline.module.css';

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

const EVENT_FILTERS = [
    { label: 'All activity', value: 'All' },
    { label: 'User actions', value: 'User' },
    { label: 'System events', value: 'System' },
    { label: 'Payments', value: 'Payment' }
];

const EVENT_ICON_CLASS: Record<TimelineEventType, string> = {
    Created: styles.iconCreated,
    Activated: styles.iconActivated,
    Paused: styles.iconPaused,
    Resumed: styles.iconResumed,
    Cancelled: styles.iconCancelled,
    Payment: styles.iconPayment
};
const EMPTY_EVENTS: TimelineEvent[] = [];

const EventIcon = ({ type }: { type: TimelineEventType }) => {
    const iconSize = 16;
    const className = EVENT_ICON_CLASS[type] ?? styles.iconCreated;
    switch (type) {
        case 'Created':
            return <PlusCircle size={iconSize} className={className} />;
        case 'Activated':
            return <PlayCircle size={iconSize} className={className} />;
        case 'Paused':
            return <PauseCircle size={iconSize} className={className} />;
        case 'Resumed':
            return <RefreshCw size={iconSize} className={className} />;
        case 'Cancelled':
            return <XCircle size={iconSize} className={className} />;
        case 'Payment':
            return <CreditCard size={iconSize} className={className} />;
        default:
            return <PlusCircle size={iconSize} className={className} />;
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
            className={styles.filterGroup}
            role="group"
            aria-label="Filter timeline events"
        >
            {EVENT_FILTERS.map((filter) => (
                <button
                    key={filter.value}
                    type="button"
                    onClick={() => setFilter(filter.value)}
                    aria-pressed={activeFilter === filter.value}
                    data-active={activeFilter === filter.value}
                    className={styles.chip}
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
        <li className={isLast ? `${styles.item} ${styles.itemLast}` : styles.item} role="listitem">
            {!isLast && <div className={styles.connector} aria-hidden="true" />}

            <div className={styles.marker}>
                <EventIcon type={event.type} />
            </div>

            <div className={styles.eventContent}>
                <div className={styles.eventTopRow}>
                    <p className={styles.eventStatus}>{event.status}</p>
                    <time className={styles.eventTime} dateTime={new Date(event.timestamp).toISOString()}>
                        {event.timestamp}
                    </time>
                </div>

                <div className={styles.eventMetaRow}>
                    <div className={styles.eventActor}>
                        {event.type === 'Payment' ? (
                            <CreditCard size={14} className={styles.actorIcon} />
                        ) : event.actor === 'System' ? (
                            <Cpu size={14} className={styles.actorIcon} />
                        ) : (
                            <User size={14} className={styles.actorIcon} />
                        )}
                        <span>{event.actor || 'System'}</span>
                    </div>
                    <span className={styles.eventTypeBadge}>{event.type}</span>
                </div>

                {event.details && <p className={styles.eventDetails}>{event.details}</p>}
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
    events
    subscriptionId: _subscriptionId,
    events = MOCK_EVENTS
}: PlanStatusTimelineProps) {
    const safeEvents = events ?? EMPTY_EVENTS;
    const [filter, setFilter] = useState('All');
    const [isExpanded, setIsExpanded] = useState(false);
    const INITIAL_COUNT = 3;

    const filteredEvents = useMemo(() => {
        const sortedEvents = [...safeEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return sortedEvents.filter((event) => isEventVisible(event, filter));
    }, [safeEvents, filter]);

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
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerRow}>
                    <div className={styles.headerIconWrap}>
                        <RefreshCw size={16} className={styles.headerIcon} aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className={styles.title}>
                            Subscription activity timeline
                        </h2>
                        <p className={styles.subtitle}>
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
                        <section key={day} aria-labelledby={`timeline-day-${dayIndex}`} className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.dayTitle} id={`timeline-day-${dayIndex}`}>
                                    {day}
                                </h3>
                                <span className={styles.dayCount}>{groupedEvents[day].length} event{groupedEvents[day].length > 1 ? 's' : ''}</span>
                            </div>
                            <ol className={styles.list}>
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
                            className={styles.loadMoreButton}
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
                                className={styles.loadMoreButton}
                                aria-expanded={isExpanded}
                            >
                                Show less
                                <ChevronUp size={16} />
                            </button>
                        )
                    )}
                </div>
            ) : safeEvents.length === 0 ? (
                <div role="status" style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b', fontSize: '0.95rem' }}>
                    No plan activity yet
                </div>
            ) : (
                <div className={styles.emptyState}>
                    No events found for this filter.
                </div>
            )}
        </div>
    );
}
