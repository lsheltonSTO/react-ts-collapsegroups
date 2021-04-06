import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IKendoTestMediafluxProps {
  description: string;
  context: WebPartContext;
  siteUrl: string;
}
