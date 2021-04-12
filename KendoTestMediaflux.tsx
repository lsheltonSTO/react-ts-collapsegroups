import React, { Component } from "react";
import { render } from "react-dom";
import { IKendoTestMediafluxProps } from './IKendoTestMediafluxProps';
import { IKendoTestMediafluxState } from './IKendoTestMediafluxState';
import {
  Grid,
  GridColumn as Column,
  GridDataStateChangeEvent,
  GridExpandChangeEvent,
  GridDetailRow
} from "@progress/kendo-react-grid";
import { mapTree, extendDataItem } from "@progress/kendo-react-treelist";
import { process, State, DataResult } from "@progress/kendo-data-query";
import '@progress/kendo-theme-default';
import { AadHttpClient, HttpClientResponse, SPHttpClient, ISPHttpClientOptions } from '@microsoft/sp-http';
import * as moment from 'moment';
import { WebPartContext } from "@microsoft/sp-webpart-base";

const dataState: State = {
};

class DetailComponent extends GridDetailRow {
  render() {
      const dataItem = this.props.dataItem;
      return (
        <section>
          <p><strong>Asset ID:</strong> {dataItem.asset_id}</p>
          <p><strong>Path:</strong> {dataItem.path}</p>
        </section>
      );
  }
}

export default class App extends React.Component<IKendoTestMediafluxProps, IKendoTestMediafluxState, GridDetailRow> {
  // state = {
  //   dataState: dataState,
  //   result: [process(this.state.items, dataState)],
  //   selected: [],
  //   collapsed: [],
  //   items: []
  // };

  constructor(props) {
    super(props);
    this.state = {
      dataState: dataState, //{ skip: 0, take: 10 },
      result: { data: [], total: 0}, //process(this.state.items, dataState),
      selected: [],
      collapsed: [],
      items: [],
      data: [],
    };
  }

  public render() {
    let newData = mapTree(this.state.result.data, "items", item => {
      if (item.filesize !== undefined) {
        return extendDataItem(item, "items", {
          expanded: !this.state.collapsed.some(
            i => i.value === item.value && i.field === item.field
          ),
          selected: this.state.selected.includes(item.filesize)
        });
      } else {
        return extendDataItem(item, "items", {
          expanded: !this.state.collapsed.some(
            i => i.value === item.value && i.field === item.field
          )
        });
      }
    });

    // const dataSource = this.state.items;
    // console.log(dataSource);

    return (
      <React.Fragment>
        <Grid
          style={{ height: "620px" }}
          data={newData} //{process(dataSource, this.state.dataState)}
          detail={DetailComponent}
          pageable
          groupable
          filterable
          resizable
          reorderable
          sortable
          total={this.state.result.total}
          onDataStateChange={this.dataStateChange}
          {...this.state.dataState}
          expandField="expanded"
          selectedField="selected"
          onExpandChange={this.expandChange}
        >
          <Column
            field="name"
            //groupId="G1"
            title="Name"
            width="180px"
          />
          <Column field="type" title="Type" width="140px" />
          <Column field="filesize" title="Filesize" width="100px" />
          <Column field="created_at" title="Created At" filter="date" format="{0:MM-dd-yyyy}" width="120px" />
          <Column field="modified_at" title="Modified At" filter="date" format="{0:MM-dd-yyyy}" width="120px" />
          {/* <Column field="path" title="Path" /> */}
          <Column field="is_directory" title="Is Directory" filter="boolean" width="100px" />
        </Grid>
      </React.Fragment>
    );
  }

  private dataStateChange = (event: GridDataStateChangeEvent) => {
    this.setState({
      dataState: event.dataState,
      result: process(this.state.items, event.dataState),
      collapsed: event.dataState.group.length === 0 ? [] : this.state.collapsed
    });
  };

  private expandChange = (event: GridExpandChangeEvent) => {

    const item = event.dataItem;
    this.setState({
      collapsed: !event.value
        ? [...this.state.collapsed, { value: item.value, field: item.field }]
        : this.state.collapsed.filter(i => i.value !== item.value)
    });
    event.dataItem.expanded = !event.dataItem.expanded;
    this.forceUpdate();
  };

  private getSiteTitle = async () => {
    const response = await this.props.context.spHttpClient.get(this.props.context.pageContext.web.absoluteUrl + "/_api/web/title", SPHttpClient.configurations.v1);
    const w = await response.json();
    console.log(w);
    return w;
  }

  private readonly _webApiUrl = 'https://srm-sciprojapp6.azurewebsites.net/';

  private getSitePath() {
    const url = this.props.context.pageContext.site.absoluteUrl;
    const urlArray = url.split("/");
    const sitePath = urlArray[urlArray.length - 1]
    return sitePath;
  };

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
                  //left side is the new object property
                  //right side is the item coming from the rest call that you are leaving the same or changing
                });
              });
            // this.setState({
            //   items: newItems
            // });

            this.setState({
              items: newItems,
              result: process(newItems, this.state.dataState)
            });

            console.log(newItems);
          });
      });
  }

  public componentDidMount() {
    this.load()
  }
}

//render(<App />, document.getElementById("root"));
