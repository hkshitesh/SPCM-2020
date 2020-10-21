FROM python:alpine3.7 
COPY . /app
WORKDIR /app
RUN pip3 install -U setuptools wheel
RUN pip3 install -r requirements.txt 
ENTRYPOINT [ "python3" ] 
CMD [ "/app/app.py" ] 
EXPOSE 5001 
