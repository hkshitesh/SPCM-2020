FROM smithmicro/web2py:alpine

USER root

# Copy my applications to the image
COPY codeheroku $WEB2PY_ROOT/applications/welcome

# Install required Python pacakages, remove sample apps and set proper ownership
RUN chown -R web2py:web2py $WEB2PY_ROOT

USER web2py
