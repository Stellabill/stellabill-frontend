import { useRef, useState } from 'react';
import Modal from './common/Modal';
import DatePickerCalendar from './DatePickerCalendar';
import PauseSchedulePreview from './PauseSchedulePreview';
import { addBillingInterval } from '../utils/billingDate';
import './PauseSubscriptionModal.css';

export interface PauseSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pauseUntilDate?: Date | null) => void;
    isLoading?: boolean;
    error?: { message: string; technicalDetails?: string } | null;
    showSchedule?: boolean;
    currentNextChargeDate?: string;
    estimatedNextCharge?: string;
    currency?: string;
    subscriptionId?: string;
}

export default function PauseSubscriptionModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    error,
    showSchedule = false,
    currentNextChargeDate = 'April 15, 2026',
    estimatedNextCharge = '50',
    currency = 'USDC',
}: PauseSubscriptionModalProps) {
    const initialFocusRef = useRef<HTMLButtonElement>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [activeTab, setActiveTab] = useState<'simple' | 'scheduled'>('simple');

    const presets = [
        {
            label: '1 week',
            value: () => {
                const date = new Date();
                date.setDate(date.getDate() + 7);
                return date;
            }
        },
        {
            label: '1 month',
            value: () => addBillingInterval(new Date(), 'monthly', 1)
        },
        {
            label: '3 months',
            value: () => addBillingInterval(new Date(), 'monthly', 3)
        }
    ];

    const handlePresetClick = (preset: (typeof presets)[0]) => {
        setSelectedDate(preset.value());
    };

    const handleConfirm = () => {
        if (!showSchedule) {
            onConfirm();
            return;
        }
        if (activeTab === 'simple') {
            onConfirm(null);
        } else {
            onConfirm(selectedDate);
        }
    };

    const isConfirmDisabled = showSchedule && activeTab === 'scheduled' && !selectedDate;

    const checklist = (
        <div className="pause-checklist-container">
            <div className="pause-checklist-item">
                <div className="checklist-icon-circle icon-orange">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 8v8M14 8v8" />
                    </svg>
                </div>
                <div className="checklist-text">
                    <h4>No charges while paused</h4>
                    <p>Your subscription will be inactive</p>
                </div>
            </div>

            <div className="pause-checklist-item">
                <div className="checklist-icon-circle icon-teal">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div className="checklist-text">
                    <h4>Resume anytime</h4>
                    <p>Reactivate when you're ready</p>
                </div>
            </div>

            <div className="pause-checklist-item">
                <div className="checklist-icon-circle icon-teal">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div className="checklist-text">
                    <h4>Balance remains available</h4>
                    <p>Your funds are safe in the prepaid vault</p>
                </div>
            </div>
        </div>
    );

    const confirmLabel = isLoading
        ? 'Pausing...'
        : showSchedule && activeTab === 'scheduled'
            ? `Pause until ${selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'date'}`
            : 'Pause subscription';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            unstyled
            labelledBy="pause-modal-title"
            describedBy="pause-modal-description"
            initialFocusRef={initialFocusRef}
            closeOnBackdrop={!isLoading}
            closeOnEscape={!isLoading}
            busy={isLoading}
            contentClassName={`pause-modal-content${showSchedule ? ' pause-modal-enhanced' : ''}`}
        >
                <button
                    className="pause-close-btn"
                    onClick={onClose}
                    disabled={isLoading}
                    aria-label="Close"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="pause-icon-header">
                    <div className="pause-icon-circle-main">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF8A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 8v8M14 8v8" />
                        </svg>
                    </div>
                </div>

                <h2 id="pause-modal-title" className="pause-title">Pause subscription?</h2>
                <p id="pause-modal-description" className="pause-description">
                    {showSchedule
                        ? "You won't be charged while paused. Choose to pause indefinitely or until a specific date."
                        : "You won't be charged until you resume. You can resume anytime."}
                </p>

                {error && (
                    <div className="pause-action-error" role="alert">
                        <p>{error.message}</p>
                        {error.technicalDetails && (
                            <details>
                                <summary>Technical details</summary>
                                <p>{error.technicalDetails}</p>
                            </details>
                        )}
                    </div>
                )}

                {showSchedule ? (
                    <>
                        <div className="modal-tabs" role="tablist">
                            <button
                                id="simple-pause-tab"
                                role="tab"
                                aria-selected={activeTab === 'simple'}
                                aria-controls="simple-pause"
                                onClick={() => setActiveTab('simple')}
                                className={`modal-tab ${activeTab === 'simple' ? 'active' : ''}`}
                            >
                                Pause indefinitely
                            </button>
                            <button
                                id="scheduled-pause-tab"
                                role="tab"
                                aria-selected={activeTab === 'scheduled'}
                                aria-controls="scheduled-pause"
                                onClick={() => setActiveTab('scheduled')}
                                className={`modal-tab ${activeTab === 'scheduled' ? 'active' : ''}`}
                            >
                                Pause until date
                            </button>
                        </div>

                        {activeTab === 'simple' && (
                            <div id="simple-pause" role="tabpanel" aria-labelledby="simple-pause-tab" className="modal-tab-panel">
                                {checklist}
                            </div>
                        )}

                        {activeTab === 'scheduled' && (
                            <div id="scheduled-pause" role="tabpanel" aria-labelledby="scheduled-pause-tab" className="modal-tab-panel">
                                <div className="preset-buttons-container">
                                    <p className="preset-label">Quick presets:</p>
                                    <div className="preset-buttons">
                                        {presets.map((preset) => (
                                            <button
                                                key={preset.label}
                                                className={`preset-btn ${selectedDate && selectedDate.toDateString() === preset.value().toDateString() ? 'active' : ''}`}
                                                onClick={() => handlePresetClick(preset)}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="calendar-container">
                                    <label className="calendar-label">Or select a custom date:</label>
                                    <DatePickerCalendar
                                        selectedDate={selectedDate}
                                        onDateSelect={setSelectedDate}
                                        minDate={new Date()}
                                    />
                                </div>

                                {selectedDate && (
                                    <PauseSchedulePreview
                                        pauseUntilDate={selectedDate}
                                        currentNextChargeDate={currentNextChargeDate}
                                        estimatedNextCharge={estimatedNextCharge}
                                        currency={currency}
                                    />
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    checklist
                )}

                <div className="pause-actions">
                    <button
                        ref={initialFocusRef}
                        className="pause-btn pause-btn-cancel"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Keep active
                    </button>
                    <button
                        className="pause-btn pause-btn-confirm"
                        onClick={handleConfirm}
                        disabled={isLoading || isConfirmDisabled}
                    >
                        {confirmLabel}
                    </button>
                </div>

                {showSchedule && (
                    <div className="modal-a11y-info">
                        <p className="a11y-info-text">
                            This modal supports keyboard navigation. Press Tab to move between options, Enter to select, and Escape to close.
                        </p>
                    </div>
                )}
        </Modal>
    );
}
