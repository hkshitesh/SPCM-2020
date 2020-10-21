# Base Image - ubuntu latest
FROM node

# Copy Workdir contents
ADD checklist-app /checklist-app/
WORKDIR /checklist-app/

# Create a Build
RUN npm install
RUN npm run client-install

# Runtime App
CMD npm run dev
