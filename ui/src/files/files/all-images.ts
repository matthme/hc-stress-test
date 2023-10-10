import { LitElement, css, html } from 'lit';
import { state } from 'lit/decorators.js';
import {
  ActionHash,
  AppInfo,
  CellInfo,
  AppAgentWebsocket,
} from '@holochain/client';
import { consume } from '@lit-labs/context';
import { Task } from '@lit-labs/task';
import { appAgentWebsocketContext, appInfoContext } from '../../contexts';
import '@material/mwc-circular-progress';
import '@material/mwc-select';
import '@material/mwc-list/mwc-list-item';

import './file-detail';
import { getCellId } from '../../utils';

export class AllImages extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .flex-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }

    .actionable {
      margin: 20px;
      width: 180px;
      height: 56px;
    }

    .file-detail {
      margin-bottom: 16px;
    }

    .loading {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
    }
  `;

  @consume({ context: appAgentWebsocketContext })
  appAgentWebsocket!: AppAgentWebsocket;

  @consume({ context: appInfoContext })
  appInfo!: AppInfo;

  @state()
  refreshInterval = 1;

  @state()
  refreshIntervalCounter = 1;

  @state()
  isActive = false;

  @state()
  interval: number | undefined;

  _fetchFiles = new Task(
    this,
    ([]) =>
      this.appAgentWebsocket.callZome({
        cap_secret: null,
        zome_name: 'files',
        fn_name: 'get_all_images',
        payload: null,
        role_name: "files",
      }) as Promise<Array<ActionHash>>,
    () => []
  );

  get cellId() {
    return getCellId(
      this.appInfo.cell_info.files.find((c: CellInfo) => 'provisioned' in c)!
    );
  }

  connectedCallback() {
    super.connectedCallback();
    this.interval = window.setInterval(() => {
      if (this.isActive) {
        if (this.refreshIntervalCounter > 1) {
          this.refreshIntervalCounter -= 1;
          return;
        }
        this._fetchFiles.run();
        this.refreshIntervalCounter = this.refreshInterval;
      }
    }, 1000);
  }

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) return html`<span>No files found.</span>`;

    return html`
      <h2>total hashes: ${hashes.length}</h2>

      <div class="flex-column">
        ${hashes.map(
          hash =>
            html`<file-detail
              .fileHash=${hash}
              class="file-detail"
              @file-deleted=${() => this._fetchFiles.run()}
            ></file-detail>`
        )}
      </div>
    `;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.interval);
  }

  toggleTimer() {
    this.isActive = !this.isActive;
  }

  handleIntervalChange(e: Event) {
    const selectElement = e.target as HTMLSelectElement;
    const selectedValue = selectElement.value;

    this.refreshInterval = parseInt(selectedValue, 10);
    this.refreshIntervalCounter = parseInt(selectedValue, 10);
    if (this.isActive) {
      this.isActive = false;
    }
  }

  renderImages() {
    return this._fetchFiles.render({
      pending: () => html`<div class="loading">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`,
      complete: hashes => this.renderList(hashes),
      error: (e: any) =>
        html`<span>Error fetching the images: ${e.data.data}.</span>`,
    });
  }

  render() {
    return html`
      <div class="flex-column">
        <div class="flex-row">
          <button
            @click=${() => this._fetchFiles.run()}
            class="actionable"
            ?disabled=${this.isActive}
          >
            Refresh
          </button>
          <button @click=${this.toggleTimer} class="actionable">
            ${this.isActive ? 'Stop' : 'Start'} Auto Refresh
          </button>
          <mwc-select
            @change=${this.handleIntervalChange}
            label="Refresh Interval"
            class="actionable"
          >
            <mwc-list-item selected value="1">1 Second</mwc-list-item>
            <mwc-list-item value="3">3 Seconds</mwc-list-item>
            <mwc-list-item value="5">5 Seconds</mwc-list-item>
          </mwc-select>
        </div>
        ${this.renderImages()}
      </div>
    `;
  }
}
