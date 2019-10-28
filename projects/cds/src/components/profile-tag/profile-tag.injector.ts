import { Injectable } from '@angular/core';
import { BaseSiteService, WindowRef, AnonymousConsentsService } from '@spartacus/core';
import { filter } from 'rxjs/operators';
import { CdsConfig, ProfileTagConfig } from '../../config/config.model';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScriptService {
  profiletagConfig: ProfileTagConfig
  bannerVisible$: Observable<boolean>
  constructor(
    private winRef: WindowRef,
    private config: CdsConfig,
    private baseSiteService: BaseSiteService,
    private router: Router,
    private anonymousConsentsService: AnonymousConsentsService
  ) {
    this.profiletagConfig = this.config.cds.profileTag;
    this.addTracker();
    this.addScript();
    this.bannerVisible$ = this.anonymousConsentsService.isAnonymousConsentsBannerVisible();
  }

  private addTracker(): void {
    this.baseSiteService
      .getActive()
      .pipe(filter(Boolean))
      .subscribe((site: string) => {
        const newConfig: ProfileTagConfig = { ...this.profiletagConfig };
        newConfig.siteId = site;
        this.track(newConfig);
      });
  }

  private addScript(): void {
    const doc: Document = this.winRef.document;
    const profileTagScript: HTMLScriptElement = doc.createElement('script');
    profileTagScript.type = 'text/javascript';
    profileTagScript.async = true;
    profileTagScript.src = this.profiletagConfig.javascriptUrl;

    doc.getElementsByTagName('head')[0].appendChild(profileTagScript);
  }

  private track(options: ProfileTagConfig) {
    const w: any = this.winRef.nativeWindow;
    w.Y_TRACKING = function () {
      (w.Y_TRACKING.q = w.Y_TRACKING.q || []).push(arguments);
    };
    const spaOptions = {
      ...options, spa: true, profileTagLoaded: () => {
        this.router.events.subscribe((event) => {
          if (event instanceof NavigationEnd) {
            w.Y_TRACKING.push({ event: 'Navigated' });
          }
        });
        this.bannerVisible$.subscribe((visible: Boolean) => {
          w.Y_TRACKING.push({ event: 'ConsentChanged', granted: !visible });
        });
      }
    }
    w.Y_TRACKING(spaOptions);
    // w.Y_TRACKING = w.Y_TRACKING || {}
    // w.Y_TRACKING.config = options;
  }

  // private addToCart() {
  //   w.Y_TRACKING.push(event_name, data)
  // }
}
