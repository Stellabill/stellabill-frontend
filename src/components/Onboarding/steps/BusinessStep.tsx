import { useState, useRef } from 'react';
import CountryRegionPicker from '../../common/CountryRegionPicker';
import './BusinessStep.css';
import '../OnboardingShell.css';

interface BusinessStepProps {
  onBack?: () => void;
  onNext?: (data: { businessName: string; website: string; logo: File | null; country: string }) => void;
}

export default function BusinessStep({ onNext }: BusinessStepProps) {
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [countryError, setCountryError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    if (!country) {
      setCountryError('Country is required.');
      return;
    }

    setError('');
    setCountryError('');
    onNext?.({
      businessName: businessName.trim(),
      website: website.trim(),
      logo,
      country,
    });
  };

  const nameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessName(e.target.value);
    if (error) setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogo(e.target.files[0]);
    }
  };

  return (
    <div>
      <div className="onboarding-field">
        <label htmlFor="business-name" className="onboarding-label">
          Business name <span aria-hidden="true">*</span>
        </label>
        <input
          id="business-name"
          type="text"
          className={`onboarding-input${error ? ' onboarding-input--error' : ''}`}
          value={businessName}
          onChange={nameChange}
          placeholder="Acme Inc."
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? 'business-error' : undefined}
        />
        {error && (
          <p id="business-error" className="onboarding-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="onboarding-field">
        <label className="onboarding-label">
          Logo <span className="optional-text">(optional)</span>
        </label>
        <div className="business-upload-container">
          <button
            type="button"
            className="business-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {logo ? logo.name : 'Upload'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="business-file-hidden"
            accept="image/*"
            aria-label="Upload logo"
          />
        </div>
        <p className="onboarding-helper">Recommended: Square image, at least 200x200px</p>
      </div>

      <div className="onboarding-field">
        <CountryRegionPicker
          value={country}
          onChange={(value) => {
            setCountry(value)
            if (countryError) setCountryError('')
          }}
          label="Country"
          helperText="Search countries by name, ISO code, or region."
          placeholder="Select a country"
        />
        {countryError && (
          <p className="onboarding-error" role="alert">
            {countryError}
          </p>
        )}
      </div>

      <div className="onboarding-field">
        <label htmlFor="business-website" className="onboarding-label">
          Website <span className="optional-text">(optional)</span>
        </label>
        <input
          id="business-website"
          type="url"
          className="onboarding-input"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div className="onboarding-actions">
        <button type="button" className="onboarding-btn onboarding-btn-primary" onClick={handleNext}>
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
