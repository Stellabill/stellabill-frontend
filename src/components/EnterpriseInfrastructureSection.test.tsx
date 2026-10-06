import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EnterpriseInfrastructureSection from './EnterpriseInfrastructureSection';

describe('EnterpriseInfrastructureSection', () => {
	it('renders the section header and description', () => {
		render(<EnterpriseInfrastructureSection />);
		
		expect(screen.getByRole('heading', { name: /enterprise-grade infrastructure/i })).toBeInTheDocument();
		expect(screen.getByText(/built for web3 saas platforms/i)).toBeInTheDocument();
	});

	it('renders the architecture overview list', () => {
		render(<EnterpriseInfrastructureSection />);
		
		const listItems = [
			'Transparent reserve flows',
			'Low-fee settlement at scale',
			'API-first commercial controls',
			'Production-safe contract governance',
		];
		
		listItems.forEach(item => {
			expect(screen.getByText(item)).toBeInTheDocument();
		});
	});

	it('renders accessible figure and image labels', () => {
		render(<EnterpriseInfrastructureSection />);
		
		expect(screen.getByRole('img', { name: /enterprise infrastructure architecture showing prepaid vaults/i })).toBeInTheDocument();
	});

	it('renders accessible data table as a fallback', () => {
		render(<EnterpriseInfrastructureSection />);
		
		const table = screen.getByRole('table', { name: /enterprise infrastructure architecture components/i });
		expect(table).toBeInTheDocument();
		
		const rows = screen.getAllByRole('row');
		// 1 header row + 4 data rows
		expect(rows).toHaveLength(5);
		
		expect(screen.getByRole('columnheader', { name: /component/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /key detail/i })).toBeInTheDocument();
	});

	it('renders all architecture nodes as interactive buttons with tooltips', () => {
		render(<EnterpriseInfrastructureSection />);
		
		const nodes = [
			{ title: 'Prepaid Vault', summary: 'USDC deposits and release schedules' },
			{ title: 'Settlement Layer', summary: 'Near-instant finality' },
			{ title: 'Billing APIs', summary: 'Usage-based pricing and orchestration' },
			{ title: 'Soroban Security', summary: 'Auditable, production-safe contracts' },
		];
		
		nodes.forEach(node => {
			const button = screen.getByRole('button', { name: new RegExp(`view details for ${node.title}`, 'i') });
			expect(button).toBeInTheDocument();
			expect(screen.getByText(node.title)).toBeInTheDocument();
			expect(screen.getByText(node.summary)).toBeInTheDocument();
			
			const tooltipId = button.getAttribute('aria-describedby');
			expect(tooltipId).toBeTruthy();
			
			// Verify tooltip exists and has an ID matching aria-describedby
			// Since useId generates random ids and we query by standard attributes
			const tooltip = document.getElementById(tooltipId as string);
			expect(tooltip).toBeInTheDocument();
			expect(tooltip).toHaveAttribute('role', 'tooltip');
		});
	});

	it('renders legend tags for visual tracking', () => {
		render(<EnterpriseInfrastructureSection />);
		
		['Funds', 'Settlement', 'Billing', 'Security'].forEach(tag => {
			expect(screen.getByText(tag)).toBeInTheDocument();
		});
		
		expect(screen.getByText('Flow legend')).toBeInTheDocument();
	});
});
