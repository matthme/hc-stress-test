use hdk::prelude::*;
use files_integrity::*;
#[hdk_extern]
pub fn get_all_files(_: ()) -> ExternResult<Vec<ActionHash>> {
    let path = Path::from("all_files");
    let links = get_links(path.path_entry_hash()?, LinkTypes::AllFiles, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let hashes: Vec<ActionHash> = records
        .into_iter()
        .filter_map(|r| r)
        .map(|r| r.action_address().clone())
        .collect();
    Ok(hashes)
}
