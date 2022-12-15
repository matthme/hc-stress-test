import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  AppWebsocket,
  ActionHash,
  InstalledAppInfo,
} from '@holochain/client';
import { provide } from '@lit-labs/context';
import '@material/mwc-circular-progress';

import { appWebsocketContext, appInfoContext } from './contexts';

@customElement('holochain-app')
export class HolochainApp extends LitElement {
  @state() loading = true;

  @provide({ context: appWebsocketContext })
  @property({ type: Object })
  appWebsocket!: AppWebsocket;



  @provide({ context: appInfoContext })
  @property({ type: Object })
  appInfo!: InstalledAppInfo;

  @state()
  fileBytes: Uint8Array | undefined;

  @query("#file-upload")
  fileUpload!: HTMLInputElement;

    // TODO! make typing right here
  async loadFileBytes(e: any) {
    const files: FileList = e.target.files;

    const reader = new FileReader();
    reader.onload = (e) => {
      console.log(e.target?.result);
    }
    reader.readAsArrayBuffer(files[0]);
    // TODO! make typing right here
    reader.onloadend = (_e) => {
      const buffer = reader.result as ArrayBuffer;
      const ui8 = new Uint8Array(buffer);
      this.fileBytes = ui8;
      // create a fake devhub happ release hash from the filehash --> used to compare when joining an applet
      // to ensure it is the same applet and to allow recognizing same applets across groups
      console.log("File loaded into memory: ", ui8);
    }
  }

  async storeFile() {
    if (!this.fileBytes) {
      alert!("No file selected!");
      return;
    }

    console.log("Storing file...")
    let record = await this.appWebsocket.callZome({
      cap_secret: null,
      cell_id: this.appInfo.cell_data[0].cell_id,
      zome_name: "files",
      fn_name: "create_file",
      payload: {
        data: this.fileBytes,
      },
      provenance: this.appInfo.cell_data[0].cell_id[1],
    });

    console.log("File stored! Got record back: ", record);
  }

  async firstUpdated() {
    this.appWebsocket = await AppWebsocket.connect(
      `ws://localhost:${process.env.HC_PORT}`
    );

    this.appInfo = await this.appWebsocket.appInfo({
      installed_app_id: 'hc-stress-test',
    });

    this.loading = false;
  }

  render() {
    if (this.loading)
      return html`
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      `;

    return html`
      <main>
        <h1>Upload file:</h1>

        <div id="content">
          <input
            style="margin-top: 7px;"
            type="file"
            id="file-upload"
            @change=${this.loadFileBytes}
          >

          <button @click=${this.storeFile}>Store!</button>
        </div>
      </main>
    `;
  }

  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      font-size: calc(10px + 2vmin);
      color: #1a2b42;
      max-width: 960px;
      margin: 0 auto;
      text-align: center;
      background-color: var(--lit-element-background-color);
    }

    main {
      flex-grow: 1;
    }

    .app-footer {
      font-size: calc(12px + 0.5vmin);
      align-items: center;
    }

    .app-footer a {
      margin-left: 5px;
    }
  `;
}
