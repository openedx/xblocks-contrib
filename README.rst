===============
xblocks-contrib
===============

This repository is the new home for XBlocks, a core component of the Open edX ecosystem.
This project involves the extraction of XBlocks from the edx-platform.

Project Overview
=======================

XBlocks are modular components that enable rich interactive learning experiences in Open edX courses.
Historically, the XBlock code was tightly coupled with the edx-platform, making it challenging to manage and extend.
By extracting XBlocks into this dedicated repository, we can reduce the complexity of the edx-platform, making it more maintainable and scalable.

XBlocks Being Moved Here
************************

These are the XBlocks being moved here, and each of their statuses:

* ``poll_question`` -- Placeholder
* ``word_cloud`` -- In Development
* ``annotatable`` -- In Development
* ``lti`` -- In Development
* ``html`` -- Placeholder
* ``discussion`` -- Placeholder
* ``problem`` -- Placeholder
* ``video`` -- Placeholder

The possible XBlock statuses are:

* Placeholder: It's just a cookiecutter thumbs-up block.
* In Development: We're building and testing this block.
* Ready to Use: You can try this on your site using the Waffle flag.
* Done The built-in block has been removed. The setup.py entrypoint has been removed from edx-platform and added to xblock-contrib.


Developing a new XBlock
=======================

There's a handy script ``utils/create_xblock.sh`` that you can use to create XBlock here. just run ::

    $ utils/create_xblock.sh

It will ask for XBlock name and XBlock class name that you want to use. Just enter these values and XBlock should be ready to work.

If faced with permission or access error run::

    $ chmod +x utils/create_xblock.sh

and run it.

Testing with Docker
********************

This XBlock comes with a Docker test environment ready to build, based on the xblock-sdk workbench. To build and run it::

    $ make dev.run

The XBlock SDK Workbench, including this XBlock, will be available on the list of XBlocks at http://localhost:8000

Translating
*************

Internationalization (i18n) is when a program is made aware of multiple languages.
Localization (l10n) is adapting a program to local language and cultural habits.

For information on how to enable translations, visit the `Open edX XBlock tutorial on Internationalization <https://docs.openedx.org/projects/xblock/en/latest/xblock-tutorial/edx_platform/edx_lms.html#internationalization-support>`_.

The included Makefile contains targets for extracting, compiling and validating translatable strings.
The general steps to provide multilingual messages for a Python program (or an XBlock) are:

1. Mark translatable strings.
2. Run i18n tools to create raw message catalogs.
3. Create language specific translations for each message in the catalogs.
4. Use ``gettext`` to translate strings.

5. Mark translatable strings
----------------------------

Mark translatable strings in python::

    from django.utils.translation import ugettext as _

    # Translators: This comment will appear in the `.po` file.
    message = _("This will be marked.")

See `edx-developer-guide <https://docs.openedx.org/en/latest/developers/references/developer_guide/internationalization/i18n.html#python-source-code>`__
for more information.

You can also use ``gettext`` to mark strings in javascript::


    // Translators: This comment will appear in the `.po` file.
    var message = gettext("Custom message.");

See `edx-developer-guide <https://docs.openedx.org/en/latest/developers/references/developer_guide/internationalization/i18n.html#javascript-files>`__
for more information.

2. Run i18n tools to create Raw message catalogs
------------------------------------------------

After marking strings as translatable we have to create the raw message catalogs.
These catalogs are created in ``.po`` files. For more information see
`GNU PO file documentation <https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html>`_.
These catalogs can be created by running::

    $ make extract_translations

This command will create the necessary ``.po`` files under
``xblocks-contrib/xblocks_contrib/<xblock name>/conf/locale/en/LC_MESSAGES/text.po``.
The ``text.po`` file is created from the ``django-partial.po`` file created by
``django-admin makemessages`` (`makemessages documentation <https://docs.djangoproject.com/en/5.2/topics/i18n/translation/#message-files>`_),
this is why you will not see a ``django-partial.po`` file.

You will need to have `edx-i18n-tools` that you can get by:

    $ make requirements

3. Create language specific translations
----------------------------------------

3.1 Add translated strings
~~~~~~~~~~~~~~~~~~~~~~~~~~

After creating the raw message catalogs, all translations should be filled out by the translator.
One or more translators must edit the entries created in the message catalog, i.e. the ``.po`` file(s).
The format of each entry is as follows::

    #  translator-comments
    A. extracted-comments
    #: reference…
    #, flag…
    #| msgid previous-untranslated-string
    msgid 'untranslated message'
    msgstr 'mensaje traducido (translated message)'

For more information see
`GNU PO file documentation <https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html>`_.

To use translations from transifex use the follow Make target to pull translations::

    $ make pull_translations

See `config instructions <https://github.com/openedx/i18n-tools#transifex-commands>`_ for information on how to set up your
transifex credentials.

See `transifex documentation <https://developers.transifex.com/docs/django-file-based>`_ for more details about integrating
django with transiflex.

3.2 Compile translations
~~~~~~~~~~~~~~~~~~~~~~~~

Once translations are in place, use the following Make target to compile the translation catalogs ``.po`` into
``.mo`` message files::

    $ make compile_translations

The previous command will compile ``.po`` files using
``django-admin compilemessages`` (`compilemessages documentation <https://docs.djangoproject.com/en/5.2/topics/i18n/translation/#compiling-message-files>`_).
After compiling the ``.po`` file(s), ``django-statici18n`` is used to create language specific catalogs. See
``django-statici18n`` `documentation <https://django-statici18n.readthedocs.io/en/v2.5.0/>`_ for more information.

To upload translations to transiflex use the follow Make target::

    $ make push_translations

See `config instructions <https://github.com/openedx/i18n-tools#transifex-commands>`_ for information on how to set up your
transifex credentials.

See `transifex documentation <https://developers.transifex.com/docs/django-file-based>`_ for more details about integrating
django with transiflex.

 **Note:** The ``dev.run`` make target will automatically compile any translations.

 **Note:** To check if the source translation files (``.po``) are up-to-date run::

    $ make detect_changed_source_translations

4. Use ``gettext`` to translate strings
---------------------------------------

Django will automatically use ``gettext`` and the compiled translations to translate strings.

Troubleshooting
~~~~~~~~~~~~~~~

If there are any errors compiling ``.po`` files run the following command to validate your ``.po`` files::

    $ make validate

See `django's i18n troubleshooting documentation
<https://docs.djangoproject.com/en/5.2/topics/i18n/translation/#troubleshooting-gettext-incorrectly-detects-python-format-in-strings-with-percent-signs>`_
for more information.
