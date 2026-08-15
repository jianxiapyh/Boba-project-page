# Boba project page

Static project website for the ECCV 2026 paper:

> **Boba: Batched Simulation for Physics-Based Gaussian Digital Twins**<br />
> Yihan Pang, Hanxiao Jiang, Sushant Kondguli, Sarita Adve, and Shenlong Wang

The site is designed for GitHub Pages and uses plain HTML, CSS, and JavaScript. It does not bundle the Boba implementation. The only implementation link points to the external [`Boba_Batched`](https://github.com/jianxiapyh/Boba/tree/Boba_Batched) branch.

## Local preview

From the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Run the dependency-free integrity check with:

```bash
python3 scripts/check_site.py
```

## GitHub Pages deployment

In the GitHub repository, open **Settings → Pages**, select **Deploy from a branch**, and publish the root of the `main` branch. The `.nojekyll` marker keeps deployment as a direct static-site publish.

The expected public URL is:

```text
https://jianxiapyh.github.io/Boba-project-page/
```

## Publication assets

- Accepted paper stored in the site: `assets/Boba_ECCV.pdf`
- Canonical paper source: <https://rsim.cs.illinois.edu/Pubs/Boba_ECCV.pdf>
- Displayed paper figures are the exact camera-ready PNGs copied from the local main-paper and supplemental Overleaf workspaces.
- Supplemental Fig. 8 is included before the Results section as `assets/images/deployment-variants.png`.
- Applications cover main-paper robot planning plus supplemental MPC accuracy, immersive XR, and RL training.
- The 62.8-second H.264 XR demonstration is stored as `assets/Boba_3D_demo.mp4` and loaded with metadata-only preload.
- `assets/images/boba-original-crop.jpg` is a square crop of the author-provided original photograph of Boba, Yihan’s cat.
- Social preview: `assets/images/social-preview.jpg` (1200 × 630)

## Design survey

The first version draws presentation patterns—not source code or visual assets—from seven award, oral, or highlight project pages:

1. [Generative Image Dynamics](https://generative-dynamics.github.io/) — CVPR 2024 Best Paper: immediate visual thesis and interactive-first storytelling.
2. [VGGT](https://vgg-t.github.io/) — CVPR 2025 Best Paper: compact resource row, method overview, and result hierarchy.
3. [UniAD](https://opendrivelab.github.io/UniAD/) — CVPR 2023 Best Paper: a systems contribution explained through a single end-to-end story.
4. [Minimalist Vision with Freeform Pixels](https://cave.cs.columbia.edu/projects/categories/project?cid=Computational+Imaging&pid=Minimalist+Vision+with+Freeform+Pixels) — ECCV 2024 Best Paper: strong application-led narrative and visual evidence.
5. [Generative Camera Dolly](https://gcd.cs.columbia.edu/) — ECCV 2024 Oral: restrained sectioning and result-centric media layout.
6. [VGGSfM](https://vggsfm.github.io/) — CVPR 2024 Highlight: concise method description followed by qualitative evidence.
7. [SpeedFolding](https://pantor.github.io/speedfolding/) — IROS 2022 Best Paper and Best RoboCup Paper: robotics applications, metrics, and demonstration-oriented organization.

The resulting Boba page uses the common strengths of these sites: an above-the-fold thesis, paper/code actions, one primary teaser, scannable headline metrics, a short method narrative, application evidence, and a copyable citation.

## Updating the site

- Replace the PDF in `assets/Boba_ECCV.pdf` when the archival version changes.
- Keep the title, author order, metrics, and BibTeX synchronized with the accepted paper.
- Keep large video files set to `preload="metadata"` so the page does not download the full demo before the visitor requests playback.
- Do not add Boba implementation files to this repository; update the external branch link instead.
