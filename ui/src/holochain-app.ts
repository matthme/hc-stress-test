import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  AppWebsocket,
  ActionHash,
  AppInfo,
  AppAgentWebsocket,
} from '@holochain/client';
import { provide } from '@lit-labs/context';
import { decode } from '@msgpack/msgpack';
import '@material/mwc-circular-progress';
import { HappNotification, notify } from '@holochain-launcher/api';

import { appAgentWebsocketContext, appInfoContext } from './contexts';
import { AllImages } from './files/files/all-images';
import { getCellId } from './utils';


customElements.define("all-images", AllImages)

@customElement('holochain-app')
export class HolochainApp extends LitElement {
  @state() loading = true;

  @provide({ context: appAgentWebsocketContext })
  @property({ type: Object })
  appAgentWebsocket!: AppAgentWebsocket;

  appWebsocket!: AppWebsocket;


  @provide({ context: appInfoContext })
  @property({ type: Object })
  appInfo!: AppInfo;

  @state()
  storing: boolean = false;

  @state()
  totalImgNrs: number | undefined = undefined;

  @state()
  currentImgNr: number | undefined = undefined;

  @state()
  fileBytes: Uint8Array | undefined;

  @query("#file-upload")
  fileUpload!: HTMLInputElement;

  @query("#n-copies")
  copies!: HTMLInputElement;

    // TODO! make typing right here
  async loadFileBytes(e: any) {
    const files: FileList = e.target.files;

    const reader = new FileReader();
    reader.onload = (err) => {
      console.log(err.target?.result);
    }
    reader.readAsArrayBuffer(files[0]);
    // TODO! make typing right here
    reader.onloadend = (_e) => {
      const buffer = reader.result as ArrayBuffer;
      const ui8 = new Uint8Array(buffer);
      this.fileBytes = ui8;
      console.log("File loaded into memory: ", ui8);
    }
  }

  async storeFile() {
    if (!this.fileBytes) {
      alert!("No file selected!");
      return;
    }

    if (!this.copies.valueAsNumber || this.copies.valueAsNumber < 1) {
      alert!("minimum number of copies is 1.")
      return;
    }

    this.storing = true;
    this.totalImgNrs = this.copies.valueAsNumber;
    this.currentImgNr = 0;

    const cellInfo = this.appInfo.cell_info.files.find((c) => "provisioned" in c);

    console.log("Total image numbers", this.totalImgNrs);
    console.log("Array: ", new Array(this.totalImgNrs).fill(0));

    try {
      await Promise.all(new Array(this.totalImgNrs).fill(0).map(async (_) => {
        console.log("Storing file.");
        const uid = Math.floor(Math.random()*100000);
        const record = await this.appAgentWebsocket.callZome({
          cell_id: getCellId(cellInfo!)!,
          zome_name: "files",
          fn_name: "create_file",
          payload: {
            data: this.fileBytes,
            uid,
          },
          provenance: getCellId(cellInfo!)![1],
        });

        console.log("File copy stored! Got record back: ", record);
        console.log("With entry: ", decode((record.entry as any).Present.entry) as File);
        if (this.currentImgNr) {
          this.currentImgNr += 1;
          this.requestUpdate();
        };
      }));
    } catch(e) {
      console.error("Failed to store all images: ", e);
      console.error("stringified error: ", JSON.stringify(e));
    }

    setTimeout(() => {
      this.totalImgNrs = undefined;
      this.currentImgNr = undefined;
      this.storing = false
    }, 3000);

  }

  async firstUpdated() {
    this.appWebsocket = await AppWebsocket.connect(
      `ws://localhost:${process.env.HC_PORT}`
    );

    this.appInfo = await this.appWebsocket.appInfo({
      installed_app_id: 'hc-stress-test',
    });

    this.appAgentWebsocket = await AppAgentWebsocket.connect("", "hc-stress-test");

    this.loading = false;
  }

  async notifyHigh() {
    const noticiation: HappNotification = {
      title: "Hello",
      body: "This is a message from hc-stress-test",
      notification_type: "random",
      icon_file_name: undefined,
      urgency: "high",
      timestamp: Date.now(),
    }
    setTimeout(async () => notify([noticiation]), 5000);
  }


  async notifyMedium() {
    const noticiation: HappNotification = {
      title: "Hello",
      body: "This is a message from hc-stress-test",
      notification_type: "random",
      icon_file_name: undefined,
      urgency: "medium",
      timestamp: Date.now(),
    }
    setTimeout(async () => notify([noticiation]), 5000);
  }

  render() {
    if (this.loading)
      return html`
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      `;
    return html`
      <main>
        <button @click=${async () => this.notifyHigh()} style="margin-top: 50px;">Notify Launcher in 5s with High Urgency</button>
        <button @click=${async () => this.notifyMedium()} style="margin-top: 10px;">Notify Launcher in 5s with Medium Urgency</button>

        <h1>Upload image:</h1>

        <div id="content" style="display: flex; flex-direction: column;">
          <div style="display: flex; flex-direction: row;">
            <input
              style="margin-top: 7px;"
              type="file"
              id="file-upload"
              accept="image/png"
              @change=${this.loadFileBytes}
            >
            number of copies: <input type="number" min="1" id="n-copies">

            <button @click=${this.storeFile}>Store!</button>
          </div>

          ${this.storing ? html`<div>uploading image ${this.currentImgNr} / ${this.totalImgNrs}</div>` : ``}

          <div>
            <all-images></all-images>
          </div>

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
