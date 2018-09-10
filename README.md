

# jolecule - WebGL viewer for proteins/DNA with annotated views

Jolecule is a WebGL viewer for proteins and DNA, with an interface that also works well on touch interfaces. The viewer has views and animated slide-show as a core feature. 

The core jolecule package is a javascript module that can display PDB structures in a web-browser. 

However, jolecule has been configured to allow usage in several ways:

0. On the website <http://jolecule.com>
1. As a native desktop electron app
2. As a local static HTML-page web-app
3. Embedded in other web-pages locally
4. Embedbed from the remote the website <http://jolecule.com/embed>

## Installation

To use Jolecule on your local web-site, or to build webaps. You can download the [zipped-package](https://github.com/boscoh/jolecule/archive/master.zip).

The requirements are:

- a modern webbrowser - Chrome, Safari, Firefox
- [node.js](https://nodejs.org/en/download/) - the javascript runtime

In the Jolecule directory, to install the required modules:

```bash
> npm install
```

## Explore PDB structures on the website

The easiest way to try Jolecule is to go to <http://jolecule.com>. 

If you know the PDB id of your protein structure, just type in <http://jolecule.com/pdb/<your_pdbId>>

## Desktop App: Explore PDB structures on your computer

An [electron](electronjs.org) app is provided that provides a useful sidebar for local PDB files. 

If you want to run the electron-version of the app, then you must first install [electron](https://electronjs.org/). To do this, go to the `jolecule/electron` directory:

 ```bash
 npm install
 ```

Then, to run a native-GUI electron app to open PDB files:

       ./jol-electron.sh [your.pdb] [directory of PDB files]

The desktop app will have a file browser for PDB files, and the creation/saving of annotated views in the file `your.views.json`. This `your.views.json` can also be used to generate slide shows in your local static web-app from the previous section.

On the command-line, run `./jol-electron.sh [pdb] [directory]`

If a specified PDB is given, the PDB will be loaded. As well, all other PDB structures in the directory will be listed in a left-handed side-bar. This is file-browser that is designed as a conveniently quick way to look at PDB structures.

## Views and Animated Slideshows

An key component of Jolecule is the ability to save and re-display views of a molecule. An animated slide-show can then be displayed by cycling smoothly through these views. 

The particular view of a molecular is saves as a list of JSON data structure, with the following structure:

```json
{
  "camera": {
    "in": [
      17.00123423615934,
      25.682855200046887,
      -0.1600056890155509
    ],
    "pos": [
      17.410000000001787,
      26.58999999999918,
      -0.2600000000028232
    ],
    "slab": {
      "z_back": 5.58086661002549,
      "z_front": -7.753908948194662,
      "zoom": 29.280544867878536
    },
    "up": [
      16.501362135372435,
      26.98427451475052,
      -0.3975675760496816
    ]
  },
  "creator": "~ apposite @28/5/2015",
  "distances": [],
  "i_atom": 1276,
  "labels": [],
  "order": 6,
  "pdbId": "1mbo",
  "selected": [
    42,
    63,
    67,
    92,
    154,
    155,
    341
  ],
  "show": {
    "all_atom": false,
    "hydrogen": false,
    "ligands": true,
    "ribbon": true,
    "sidechain": false,
    "trace": false,
    "water": false
  },
  "text": "The surrounding residues around the oxygen is crucial for oxygen molecule binding.",
  "version": 2,
  "view_id": "view:e9mx4p"
}
```

The views are in a Json file with the same basename as the associated PDB file. For instance, `1mbo.pdb` will have a view file in `1mbo.views.json`. 

On the public server, the views of a PDB structure <http://jolecule.com/pdb/1mbo> will be accessible at <http://jolecule.com/pdb/1mbo.views.json>. You can download and modify these files.

Jolecule knows how to animate smoothly between views. This will create a slide-show of your structure. Press `Play` in the bottom-left hand to start the slideshow. 

A slide-show between the views by clicking on `Play`. It's easiest to create the `views.json` file using the electron app. 


## Make an animated slide-show; local static web-app

A good way to start with Jolecule is to create a static web page that automatically displays a PDB file `your.pdb`:

```bash
> ./jol-static.js your.pdb
```

This will create a directory `your-jol` and a completely contained web-page is available at `your-jol/pdb-index.html`.

If there also exists a `your.views.json`, these will also be built statically in the webpage

Then, use the `jol-static.js` to create a local web-app, which will incorporate the `views.json` file into the web-app.


## Embed on your own web-page, remotely 

The local web-app created by `jol-static.js` uses the embedded mode of Jolecule. The widget can be easily resized and inserted in other web-pages. The embeding follows the form in the resultant web-app. Alternatively, if your target is an internet site, you can embed directly against the `http://jolecule.com`. For examples, for 1MBO, see <http://jolecule.com/embed/pdb?pdbId=1mbo>.

Jolecule is designed to be easily embeddable as widgets in an external web-page. You can link to the public website or create a self-contained local version that can zipped and stuffed into an email attachment.

First run `jol-static.sh` to generate an existing embedded web-app with the dataServer. The dataServer is a javascript data file that holds the protein PDB data and any saved vies. An example is given in `examples/1mbo-jol`. 

From the example, you can extract the code that loads Jolecule and adapt it to your web-site. The key files are:

- index.html - generic html that looks for the following files
- require.js - the module loader
- jolecule.js - the bundled jolecule UMD module
- jolecule.css - common stylings
- select2.css - stylings for cross-platform drop-down selector
- data-server.js - specific data for your structure.

This is the loading code in `index.html`:

```html
<html>
  <div id="jolecule-protein-container"></div>
</html>
<script src="require.js"></script>
<script>
require(['jolecule'], function(jolecule) {
  var j = jolecule.initFullPageJolecule(
    '#jolecule-protein-container',
    '#jolecule-views-container',
    { 
      isEditable: true,
      isExtraEditable: true,
      isGrid: true,
      isPlayable: true,
      backgroundColor: 0x000000
    });
  require(["data-server"], function(dataServer) {
    j.asyncAddDataServer(dataServer);
  });
});
</script>
```

Jolecule will attempt to fit within the size of `#jolecule-protein-container`.

For multiple widgets in a single page, you can load multiple times, using different values for `dataServer` and `div_tag`.

Multiple structures can be loaded by loading different dataServers.

The parameters in `initEmbedJolecule` controls how the widget is displayed:

- `isEditable`: shows buttons that allows rendering options
- `isExtraEditable`: more buttons
- `isGrid`: control panel to show binding atom controls
- `isPlayable`: shows the buttons to move through annotated view slide-show
- `backgroundColor`: the color in hex for the background e.g. 0xFFFFFF 0x000000

## Developing jolecule

If you want to edit the source code to jolecule, the source code is in `jolecule/src`. It is written in ES6 and needs to be compiled. The compiled module is found in `jolecule/dist/jolecule.js`. To compile the source code, in the Jolecule directory, run:

    ./node_modules/.bin/webpack

Alternatively, to create a watcher for changes, run:

    ./node_modules/.bin/webpack -w

In the watch mode, open the static web-app in `dist/index.html`, and reload the web-page after the compilation is finished.


## Visual Graphic Design 

Jolecule has a focused design for rendering proteins and DNA. The visual design focuses on being able to transition between an overall cartoon view with detailed stereochemical views of bonds and atoms. To enable that, ribbons are drawn through the C-alpha atoms in the backbone chain. This gives a pleated look to the beta-sheets, but has the advantage that sidechains can be draw to protrube clearly from the ribbon in both helices and sidechains.

The author has found that sidechains protruding from ribbons provides an excellent intermediate representation that can show a good intermediate level of details between protein architecture and direct atomic interaction between sidechains.

The cartoon view uses a flat ribbon for alpha-helices and beta-sheets, with a distinct thin tube for coils. C-alpha atoms are shown as arrows to indicate chain direction, and this can make it easy to determine parallel from antiparallel beta-sheets and helical alignments.

In the display of nucleotides, the cartoon tube shows the bases as a well-defined object. This is done to indicate the importance of base-stacking as an ordering principle in nucleotide structure.

## Changelog
- 5.0 (Sep 2016)
    - Proper fly-weight for loading data structures
    - Drawing uses only typed-arrays 
    - colors implemented on residue level
    - spherical views
    - transparent chain mode
    - embedded works a lot more flexibly
    - file-browser sidebar for electron app
    - slideshow modes with rock and rotate
    - select residue selector
    - improved sequence bar (with help from Sean O'Donoghue)
- 4.0 (Dec 2016)
    - converted to ES6 using import/export
    - webpack to transpile to bundled ES5 UMD module
    - data delivered as AMD modules
    - modules loaded through require.js
    - converted all 3D vector map to use three.js
    - upgraded to three.js 0.79
    - electron cross-platform GUI
    - switched from python to node for file processing
- 3.0 (Oct 2015)
    - switched rendering to three.js/WebGL
    - DNA ribbon representation
    - arrow for Calphas
    - sequence-bar 
    - peptide-bond block representation
- 2.0 (June 2015)
	- bond detector 
	- global animation loop
	- correct embedding of widgets in DOM
	- json representation of views
	- parses PDB files in javascript
	- local web-server
	- multiple local loading options
	- integrated visual/residue controls in widgets
	- generation of self-contained webapp
	- single codebase for appengine/local-web/self-contained
	- responsive/iOS-touch web design
- 1.0 (May 2011) 
    - original release

