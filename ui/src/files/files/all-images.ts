import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { InstalledCell, AgentPubKey, EntryHash, ActionHash, Record, AppWebsocket, AppInfo, CellInfo, AppAgentWebsocket } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { Task } from '@lit-labs/task';
import { appAgentWebsocketContext, appInfoContext } from '../../contexts';
import '@material/mwc-circular-progress';

import './file-detail';
import { getCellId } from '../../utils';

export class AllImages extends LitElement {
  @consume({ context: appAgentWebsocketContext })
  appAgentWebsocket!: AppAgentWebsocket;

  @consume({ context: appInfoContext })
  appInfo!: AppInfo;


  _fetchFiles = new Task(this, ([]) => this.appAgentWebsocket.callZome({
    cap_secret: null,
    cell_id: this.cellId!,
    zome_name: 'files',
    fn_name: 'get_all_images',
    payload: null,
    provenance: this.cellId![1]
  }) as Promise<Array<ActionHash>>, () => []);

  get cellId() {
    return getCellId(this.appInfo.cell_info["files"].find((c: CellInfo) => "Provisioned" in c)!);
  }

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) return html`<span>No files found.</span>`;

    return html`
      <div style=""><h2>total hashes: ${hashes.length}</h2></div>

      <div style="display: flex; flex-direction: column; text-align: left">
        ${hashes.map(hash =>
      html`<file-detail .fileHash=${hash} style="margin-bottom: 16px;" @file-deleted=${() => this._fetchFiles.run()}></file-detail>`
    )}
      </div>
    `;
  }

  render() {
    console.log("RENDERING ALL IMAGES");
    return this._fetchFiles.render({
      pending: () => html`<div style="display: flex; flex: 1; align-items: center; justify-content: center">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`,
      complete: (hashes) => this.renderList(hashes),
      error: (e: any) => html`<span>Error fetching the images: ${e.data.data}.</span>`
    });
  }
}
