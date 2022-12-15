
import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, DnaSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';


test('create file', { concurrency: 1 }, async t => {
  await runScenario(async scenario => {

    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testDnaPath = process.cwd() + '/' + "../dnas/files/workdir/files.dna";

    // Set up the array of DNAs to be installed, which only consists of the
    // test DNA referenced by path.
    const dnas: DnaSource[] = [{ path: testDnaPath }];

    // Add 2 players with the test DNA to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithHapps([dnas, dnas]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();


    const createInput = {
  data: [63, 18, 96]
};

    // Alice creates a file
    const record: Record = await alice.cells[0].callZome({
      zome_name: "files",
      fn_name: "create_file",
      payload: createInput,
    });
    assert.ok(record);

  });
});


test('create and read file', { concurrency: 1 }, async t => {
  await runScenario(async scenario => {

    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testDnaPath = process.cwd() + '/' + "../dnas/files/workdir/files.dna";

    // Set up the array of DNAs to be installed, which only consists of the
    // test DNA referenced by path.
    const dnas: DnaSource[] = [{ path: testDnaPath }];

    // Add 2 players with the test DNA to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithHapps([dnas, dnas]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const createInput: any = {
  data: [74, 91, 76]
};

    // Alice creates a file
    const record: Record = await alice.cells[0].callZome({
      zome_name: "files",
      fn_name: "create_file",
      payload: createInput,
    });
    assert.ok(record);
    
    // Wait for the created entry to be propagated to the other node.
    await pause(300);

    // Bob gets the created file
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "files",
      fn_name: "get_file",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(createInput, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update file', { concurrency: 1 }, async t => {
  await runScenario(async scenario => {

    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testDnaPath = process.cwd() + '/' + "../dnas/files/workdir/files.dna";

    // Set up the array of DNAs to be installed, which only consists of the
    // test DNA referenced by path.
    const dnas: DnaSource[] = [{ path: testDnaPath }];

    // Add 2 players with the test DNA to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithHapps([dnas, dnas]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const createInput = {
  data: [12, 18, 96]
};

    // Alice creates a file
    const record: Record = await alice.cells[0].callZome({
      zome_name: "files",
      fn_name: "create_file",
      payload: createInput,
    });
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the file
    let contentUpdate: any = {
  data: [86, 26, 10]
};
    let updateInput = { 
      original_file_hash: originalActionHash,
      previous_file_hash: originalActionHash,
      updated_file: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "files",
      fn_name: "update_file",
      payload: updateInput,
    });
    assert.ok(updatedRecord);


    // Wait for the updated entry to be propagated to the other node.
    await pause(300);
        
    // Bob gets the updated file
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "files",
      fn_name: "get_file",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);


    // Alice updates the file again
    contentUpdate = {
  data: [83, 96, 30]
};
    updateInput = { 
      original_file_hash: originalActionHash,
      previous_file_hash: updatedRecord.signed_action.hashed.hash,
      updated_file: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "files",
      fn_name: "update_file",
      payload: updateInput,
    });
    assert.ok(updatedRecord);


    // Wait for the updated entry to be propagated to the other node.
    await pause(300);
        
    // Bob gets the updated file
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "files",
      fn_name: "get_file",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);

  });
});

test('create and delete file', { concurrency: 1 }, async t => {
  await runScenario(async scenario => {

    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testDnaPath = process.cwd() + '/' + "../dnas/files/workdir/files.dna";

    // Set up the array of DNAs to be installed, which only consists of the
    // test DNA referenced by path.
    const dnas: DnaSource[] = [{ path: testDnaPath }];

    // Add 2 players with the test DNA to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithHapps([dnas, dnas]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const createInput = {
  data: [47, 45, 72]
};

    // Alice creates a file
    const record: Record = await alice.cells[0].callZome({
      zome_name: "files",
      fn_name: "create_file",
      payload: createInput,
    });
    assert.ok(record);
        
    // Alice deletes the file
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "files",
      fn_name: "delete_file",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);


    // Wait for the entry deletion to be propagated to the other node.
    await pause(300);
        
    // Bob tries to get the deleted file
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "files",
      fn_name: "get_file",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(readDeletedOutput, undefined);

  });
});
