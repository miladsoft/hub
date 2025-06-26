import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredAngorProjects } from './useFilteredAngorProjects';
import { TestApp } from '@/test/TestApp';
import type { AngorProject, ProjectFilters } from '@/types/angor';

// Mock the deny service
vi.mock('@/services/denyService', () => ({
  useDenyList: () => ({
    isDenied: (projectId: string) => projectId === 'angor1q2a5m2zcwpmkh49z05pg6gd9cxm4dhx3ywfclem',
    isLoading: false,
    error: null,
  }),
  filterDeniedProjects: (projects: any[], denyService: any) => {
    return projects.filter(project => !denyService.isDenied(project.projectIdentifier));
  },
}));

describe('useFilteredAngorProjects', () => {
  const mockProjects: Partial<AngorProject>[] = [
    {
      projectIdentifier: 'angor1qfs3835r3r8leha9ksnrf8jadvtyzwuzu7huqk9',
      targetAmount: 1000,
      amountInvested: 500,
      investorCount: 10,
      metadata: {
        name: 'Project 1',
        about: 'Test project',
      },
    },
    {
      projectIdentifier: 'angor1q2a5m2zcwpmkh49z05pg6gd9cxm4dhx3ywfclem', // This should be denied
      targetAmount: 2000,
      amountInvested: 1000,
      investorCount: 20,
      metadata: {
        name: 'Denied Project',
        about: 'This project should be filtered out',
      },
    },
    {
      projectIdentifier: 'angor1qvalid123456789',
      targetAmount: 1500,
      amountInvested: 750,
      investorCount: 15,
      metadata: {
        name: 'Valid Project',
        about: 'This project should be visible',
      },
    },
  ];

  const filters: ProjectFilters = {};

  it('should filter out denied projects', () => {
    const { result } = renderHook(
      () => useFilteredAngorProjects(mockProjects as AngorProject[], filters),
      { wrapper: TestApp }
    );

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects.find(p => p.projectIdentifier === 'angor1q2a5m2zcwpmkh49z05pg6gd9cxm4dhx3ywfclem')).toBeUndefined();
    expect(result.current.projects.find(p => p.projectIdentifier === 'angor1qfs3835r3r8leha9ksnrf8jadvtyzwuzu7huqk9')).toBeDefined();
    expect(result.current.projects.find(p => p.projectIdentifier === 'angor1qvalid123456789')).toBeDefined();
  });
});
