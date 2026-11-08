import { Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { MemberAuthService } from "../../services/member-auth";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./register.html",
  styleUrl: "./register.css",
})
export class Register {
  private readonly auth = inject(MemberAuthService);
  private readonly router = inject(Router);

  constructor() {
    void this.auth.ready().then(async () => {
      if (this.auth.isAuthenticated()) {
        await this.router.navigate(["/"]);
      }
    });
  }
}
