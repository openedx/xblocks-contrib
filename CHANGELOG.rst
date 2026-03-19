Change Log
##########

..
   All enhancements and patches to xblocks-contrib will be documented
   in this file.  It adheres to the structure of https://keepachangelog.com/ ,
   but in reStructuredText instead of Markdown (for ease of incorporation into
   Sphinx documentation and the PyPI description).

   This project adheres to Semantic Versioning (https://semver.org/).

.. There should always be an "Unreleased" section for changes pending release.

Unreleased
**********

0.16.0 - 2026-03-19
*******************

Added
=====
* Added a ``pyproject.toml`` file to handle our package settings and build configuration in a more modern, standard way.
* Added the ``build`` package to ``requirements/pip-tools.in`` so we can easily build our package in clean, isolated environments.

Changed
=======
* Updated how we manage dependencies: ``requirements/base.in`` now reads directly from our new ``pyproject.toml`` file, which keeps our existing ``pip-tools`` setup working perfectly.
* Updated our license declaration to use the standard ``AGPL-3.0-or-later`` format to clear up recent build warnings.

Removed
=======
* Removed the old ``setup.py`` and ``setup.cfg`` files, as everything is now neatly organized inside ``pyproject.toml``.
* Removed the ``universal=1`` build setting, as we no longer need to support Python 2.
* Removed ``setuptools`` and ``wheel`` from ``requirements/pip-tools.in``, as our new build process handles these automatically behind the scenes.
* Removed the custom ``load_requirements()`` script. Our core dependencies are now simply written as a plain, easy-to-read list directly inside ``pyproject.toml``.

0.15.1 - 2026-03-18
**********************************************

Added
=====

* Implemented JSON-based view to fetch a PDF-block's settings.

0.15.0 - 2026-03-18
**********************************************

Added
=====

* Implemented the Discussion XBlock, extracted from edx-platform.

0.13.1 - 2026-03-09
**********************************************

Fixed
=====

* Fix TemplateDoesNotExist Error for capa templates.

0.13.0 - 2026-03-03
**********************************************

Added
=====

* Implemented the Video XBlock, extracted from edx-platform.


0.12.1 - 2026-03-03
**********************************************

Added
=====

* Adds Capa app entrypoints in setup.py.


0.12.0 - 2026-03-02
**********************************************

Added
=====

* Implemented the Problem XBlock, extracted from edx-platform.



0.11.1 - 2026-02-27
**********************************************

Fixed
=====

* Package data for PDF block (templates, static assets) was missing and is now included.

0.11.0 - 2026-01-26
**********************************************

Added
=====

* Implemented PDF Block, extracted from third party plugin.

0.6.0 – 2025-08-13
**********************************************

Added
=====

* Restore get_html in the extracted Annotatable XBlock to match existing edx-platform

0.5.0 – 2025-08-8
**********************************************

Added
=====

* Implemented the poll XBlock & HTML XBlock, extracted from edx-platform.

0.4.0 – 2025-05-7
**********************************************

Added
=====

* Implemented the LTI XBlock, extracted from edx-platform.


0.3.0 – 2025-04-8
**********************************************

Added
=====

* Added support for django 5.2.
* Implemented the Annotatable XBlock, extracted from edx-platform.


0.2.0 – 2025-02-12
**********************************************

Added
=====

* Implemented the Word Cloud Block, extracted from edx-platform.


0.1.0 – 2024-07-04
**********************************************

Added
=====

* First release on PyPI.
