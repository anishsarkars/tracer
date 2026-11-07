//! Build script: switch the TracerLens bindings to the real JSON ABI when
//! `abi/TracerLens.json` is present (copied from `contracts/out/TracerLens.sol/TracerLens.json`).
//! Set `TRACER_LENS_FROM_SOL=1` to force the hand-written `sol!` definitions from ARCHITECTURE §2.2.
use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=abi/TracerLens.json");
    println!("cargo:rerun-if-env-changed=TRACER_LENS_FROM_SOL");
    println!("cargo::rustc-check-cfg=cfg(lens_abi_json)");
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".into());
    let json = Path::new(&manifest_dir).join("abi/TracerLens.json");
    if json.exists() && std::env::var("TRACER_LENS_FROM_SOL").is_err() {
        println!("cargo:rustc-cfg=lens_abi_json");
        println!("cargo:warning=TracerLens bindings generated from abi/TracerLens.json");
    }
}
