import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MemberAuthService } from './member-auth';

export const memberGuard: CanActivateFn = async (route, state): Promise<boolean | any> => {
  const auth = inject(MemberAuthService);
  const router = inject(Router);

  await auth.ready();

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { redirect: state.url },
  });
};
