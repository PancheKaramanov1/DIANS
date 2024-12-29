import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()), provideAnimationsAsync(), provideAnimationsAsync('noop'), provideAnimationsAsync(), provideCharts(withDefaultRegisterables())
  ]
};
