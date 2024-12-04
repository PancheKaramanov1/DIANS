import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodePopupComponent } from './code-popup.component';

describe('CodePopupComponent', () => {
  let component: CodePopupComponent;
  let fixture: ComponentFixture<CodePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodePopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
