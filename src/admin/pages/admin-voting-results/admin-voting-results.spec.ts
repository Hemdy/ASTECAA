import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminVotingResults } from './admin-voting-results';

describe('AdminVotingResults', () => {
  let component: AdminVotingResults;
  let fixture: ComponentFixture<AdminVotingResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminVotingResults]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminVotingResults);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
