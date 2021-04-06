import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'KendoTestMediafluxWebPartStrings';
import KendoTestMediaflux from './components/index';
import { IKendoTestMediafluxProps } from './components/IKendoTestMediafluxProps';
import '@progress/kendo-theme-default/dist/all.css';
import { sp } from '@pnp/sp';

export interface IKendoTestMediafluxWebPartProps {
  description: string;
}

export default class KendoTestMediafluxWebPart extends BaseClientSideWebPart<IKendoTestMediafluxWebPartProps> {

  public onInit(): Promise < void> {
    return super.onInit().then(_ => {
      sp.setup({
        spfxContext: this.context
      });
    });
  }

  public render(): void {
    const element: React.ReactElement<IKendoTestMediafluxProps> = React.createElement(
      KendoTestMediaflux,
      {
        description: this.properties.description,
        context: this.context,
        siteUrl: this.context.pageContext.web.absoluteUrl
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
