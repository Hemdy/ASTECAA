import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './auth.service';

export const adminGuard: CanActivateFn = async (route, state): Promise<boolean | any> => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  await auth.ready();

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/login'], {
    queryParams: { redirect: state.url },
  });
};
