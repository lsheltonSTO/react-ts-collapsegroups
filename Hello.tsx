import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IKendoTestMediafluxProps } from './IKendoTestMediafluxProps';
import { IKendoTestMediafluxState } from './IKendoTestMediafluxState';
import { Grid, GridColumn, GridExpandChangeEvent } from '@progress/kendo-react-grid';
import { process } from '@progress/kendo-data-query';
import '@progress/kendo-theme-default';
//import styles from './KendoTestMediaflux.module.scss';
import { AadHttpClient, HttpClientResponse, SPHttpClient, ISPHttpClientOptions } from '@microsoft/sp-http';
import { IntlService } from '@progress/kendo-react-intl';
import { parseDate } from '@telerik/kendo-intl';
import * as moment from 'moment';

export default class WebApiConsumer extends React.Component<IKendoTestMediafluxProps, IKendoTestMediafluxState> {
  private readonly _webApiUrl = 'https://srm-sciprojapp6.azurewebsites.net/';
  public expandedValues = [];
  public dataStateChange = (event) => {
    this.setState({
      dataState: event.data
    });
  }
  // public expandChange = (event: { dataItem: { value: any; }; }) => {
  //   let index = this.expandedValues.indexOf(event.dataItem.value);
  //   if (index >= 0) {
  //     this.expandedValues.splice(index, 1);
  //   } else {
  //     this.expandedValues.push(event.dataItem.value);
  //   }

  //   this.forceUpdate();
  // }

  // public expandChange = event => {
  //   const isExpanded =
  //     event.dataItem.expanded === undefined
  //       ? event.dataItem.aggregates
  //       : event.dataItem.expanded;
  //   event.dataItem.expanded = !isExpanded;
  //   this.setState({ ...this.state });
  // };

  // public expandChange = event => {
  //   const item = event.dataItem;
  //   this.setState({
  //     collapsed: !event.value ?
  //       [...this.state.collapsed, { value: event.dataItem.value, field: event.dataItem.field }] :
  //       this.state.collapsed.filter(i => i.value !== item.value && i.field !== item.field)
  //   });
  // };

  //public expandChange: (event: GridExpandChangeEvent) => void;

 public expandChange = (event) => {
    event.dataItem.expanded = !event.dataItem.expanded;
    this.forceUpdate();
}

  constructor(props) {
    super(props);
    this.state = {
      gridData: [],
      dataState: { skip: 0, take: 10 },
      data: [],
      items: [],
      collapsed: []
    };
  }

  public render(): React.ReactElement<IKendoTestMediafluxProps> {
    let data = process(this.state.data, this.state.dataState);
    data.data.map(item => {
      let index = this.expandedValues.indexOf(item.value);
      if (index === -1) {
        item.expanded = false;
        return item;
      }
      return item;
    });

    const dataSource = this.state.items;
    console.log(dataSource);

    return (
      <div>
        <Grid data={process(dataSource, this.state.dataState)}
          pageable
          filterable
          sortable
          groupable
          resizable
          onDataStateChange={(e) => this.setState({ dataState: e.dataState })}
          {...this.state.dataState}
          onExpandChange={this.expandChange}
          expandField="expanded"
        >
          <GridColumn field="name" title="Name" width="180px" />
          <GridColumn field="type" title="Type" width="140px" />
          <GridColumn field="filesize" title="Filesize" width="100px"/>
          <GridColumn field="created_at" title="Created At" filter="date" format="{0:MM-dd-yyyy}" width="120px" />
          <GridColumn field="modified_at" title="Modified At" filter="date" format="{0:MM-dd-yyyy}" width="120px"/>
          <GridColumn field="path" title="Path" />
          <GridColumn field="is_directory" title="Is Directory" filter="boolean" width="100px"/>
        </Grid>
      </div>
    );
  }

  private getSiteTitle = async () => {
    const response = await this.props.context.spHttpClient.get(this.props.context.pageContext.web.absoluteUrl + "/_api/web/title", SPHttpClient.configurations.v1);
    const w = await response.json();
    console.log(w);
    return w;
  }

  private load = async () => {
    const myOptions: ISPHttpClientOptions = {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "GET",
      mode: "cors"
    };
    this.getSiteTitle();
    const sitePath = this.getSitePath();

    this.props.context.aadHttpClientFactory
      .getClient('3b65c4b6-061d-4095-89e5-d1888697eced') //azure AD app registration ID
      .then((client: AadHttpClient): void => {
        // connected to the API

        client.get(`${this._webApiUrl}api/Mediaflux/items?sitePath=${sitePath}`, AadHttpClient.configurations.v1, myOptions)
          .then((response: HttpClientResponse): Promise<any[]> => {
            return response.json();
          })
          .then((items: any[]): void => {
            this.setState({
              items: items
            });
            let newItems = [];
            items.forEach(
              (item: any): void => {
                //console.log(item);
                newItems.push({
                  asset_id: item.asset_id,
                  name: item.name,
                  type: item.type,
                  filesize: item.filesize,
                  created_at: moment(item.created_at).toDate(),
                  modified_at: moment(item.modified_at).toDate(),
                  path: item.path,
                  url: item.url,
                  is_directory: item.is_directory
                  //all your properties you need
                  //left side is the new object property
                  //right side is the item coming from the rest call that you are leaving the same or changing
                });
              });
              this.setState({
                items: newItems
              });
          });
      });

    console.log(sitePath);
    //console.log(items); //this is where you actually do something with the items, store in a list or whatever, 31-43 is all necessary
  };

  private getSitePath() {
    const url = this.props.context.pageContext.site.absoluteUrl;
    const urlArray = url.split("/");
    const sitePath = urlArray[urlArray.length - 1]
    return sitePath;
  };
  componentDidMount() {
    this.load()
  }
}
