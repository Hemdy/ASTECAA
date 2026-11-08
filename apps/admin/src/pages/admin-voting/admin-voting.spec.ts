import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminVoting } from './admin-voting';

describe('AdminVoting', () => {
  let component: AdminVoting;
  let fixture: ComponentFixture<AdminVoting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminVoting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminVoting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
