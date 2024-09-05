# This Dockerfile sets up an XBlock SDK environment for developing and testing XBlocks.
# The following commands in the Makefile facilitate the Docker lifecycle:
# - `make dev.clean`: Cleans up any existing Docker containers and images.
# - `make dev.build`: Builds the Docker image for the XBlock SDK environment.
# - `make dev.run`: Cleans, builds, and runs the container, mapping the local project directory.

FROM openedx/xblock-sdk
RUN mkdir -p /usr/local/src/xblocks-contrib
VOLUME ["/usr/local/src/xblocks-contrib"]
RUN apt-get update && apt-get install -y gettext
RUN echo "pip install -r /usr/local/src/xblocks-contrib/requirements/dev.txt" >> /usr/local/src/xblock-sdk/install_and_run_xblock.sh
RUN echo "pip install -e /usr/local/src/xblocks-contrib" >> /usr/local/src/xblock-sdk/install_and_run_xblock.sh
RUN echo "cd /usr/local/src/xblocks-contrib && make compile_translations && cd /usr/local/src/xblock-sdk" >> /usr/local/src/xblock-sdk/install_and_run_xblock.sh
RUN echo "exec python /usr/local/src/xblock-sdk/manage.py \"\$@\"" >> /usr/local/src/xblock-sdk/install_and_run_xblock.sh
RUN chmod +x /usr/local/src/xblock-sdk/install_and_run_xblock.sh
ENTRYPOINT ["/bin/bash", "/usr/local/src/xblock-sdk/install_and_run_xblock.sh"]
CMD ["runserver", "0.0.0.0:8000"]
