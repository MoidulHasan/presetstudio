<template>
  <div class="grid gap-4 md:grid-cols-2">
    <PreviewDemo title="Accordion">
      <Accordion value="0">
        <AccordionPanel value="0">
          <AccordionHeader>What is a preset?</AccordionHeader>
          <AccordionContent>
            <p class="m-0">
              A set of design tokens that styles every component.
            </p>
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="1">
          <AccordionHeader>Can I use it in Nuxt?</AccordionHeader>
          <AccordionContent>
            <p class="m-0">
              Yes, through the PrimeVue Nuxt module.
            </p>
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel
          value="2"
          disabled
        >
          <AccordionHeader>Disabled panel</AccordionHeader>
          <AccordionContent />
        </AccordionPanel>
      </Accordion>
    </PreviewDemo>

    <PreviewDemo title="Tabs">
      <Tabs value="0">
        <TabList>
          <Tab value="0">
            Overview
          </Tab>
          <Tab value="1">
            Activity
          </Tab>
          <Tab
            value="2"
            disabled
          >
            Disabled
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <p class="m-0">
              Tabs use the primary color for the active indicator.
            </p>
          </TabPanel>
          <TabPanel value="1">
            <p class="m-0">
              No recent activity.
            </p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </PreviewDemo>

    <PreviewDemo title="Card">
      <Card>
        <template #title>
          Weekend getaway
        </template>
        <template #subtitle>
          2 nights · Lisbon
        </template>
        <template #content>
          <p class="m-0">
            Cards group related content and actions.
          </p>
        </template>
        <template #footer>
          <div class="flex gap-2">
            <Button
              label="Book"
              size="small"
            />
            <Button
              label="Details"
              severity="secondary"
              size="small"
              outlined
            />
          </div>
        </template>
      </Card>
    </PreviewDemo>

    <PreviewDemo title="Panel · Fieldset">
      <Panel
        header="Panel"
        toggleable
      >
        <p class="m-0">
          A collapsible container with a header.
        </p>
      </Panel>
      <Fieldset
        legend="Fieldset"
        toggleable
      >
        <p class="m-0">
          Groups related form content.
        </p>
      </Fieldset>
    </PreviewDemo>

    <PreviewDemo
      title="Stepper"
      wide
    >
      <Stepper value="2">
        <StepList>
          <Step value="1">
            Account
          </Step>
          <Step value="2">
            Shipping
          </Step>
          <Step value="3">
            Payment
          </Step>
        </StepList>
        <StepPanels>
          <StepPanel
            v-slot="{ activateCallback }"
            value="1"
          >
            <div class="flex justify-end">
              <Button
                label="Next"
                icon="pi pi-arrow-right"
                icon-pos="right"
                @click="activateCallback('2')"
              />
            </div>
          </StepPanel>
          <StepPanel
            v-slot="{ activateCallback }"
            value="2"
          >
            <p class="mb-3">
              Enter your shipping details.
            </p>
            <div class="flex justify-between">
              <Button
                label="Back"
                severity="secondary"
                @click="activateCallback('1')"
              />
              <Button
                label="Next"
                @click="activateCallback('3')"
              />
            </div>
          </StepPanel>
          <StepPanel
            v-slot="{ activateCallback }"
            value="3"
          >
            <div class="flex justify-start">
              <Button
                label="Back"
                severity="secondary"
                @click="activateCallback('2')"
              />
            </div>
          </StepPanel>
        </StepPanels>
      </Stepper>
    </PreviewDemo>

    <PreviewDemo
      title="Toolbar"
      wide
    >
      <Toolbar>
        <template #start>
          <div class="flex gap-2">
            <Button
              icon="pi pi-plus"
              label="New"
              size="small"
            />
            <Button
              icon="pi pi-upload"
              label="Upload"
              severity="secondary"
              size="small"
              text
            />
          </div>
        </template>
        <template #end>
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              placeholder="Search"
              size="small"
            />
          </IconField>
        </template>
      </Toolbar>
    </PreviewDemo>

    <PreviewDemo title="Splitter">
      <Splitter style="height: 160px">
        <SplitterPanel class="flex items-center justify-center">
          Left
        </SplitterPanel>
        <SplitterPanel>
          <Splitter layout="vertical">
            <SplitterPanel class="flex items-center justify-center">
              Top
            </SplitterPanel>
            <SplitterPanel class="flex items-center justify-center">
              Bottom
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>
      </Splitter>
    </PreviewDemo>

    <PreviewDemo title="ScrollPanel · ScrollTop · Divider">
      <ScrollPanel style="width: 100%; height: 120px">
        <p
          v-for="i in 6"
          :key="i"
          class="mb-3"
        >
          Paragraph {{ i }}. Scroll to see the themed scrollbar and the scroll-to-top button.
        </p>
        <ScrollTop
          target="parent"
          :threshold="60"
          icon="pi pi-arrow-up"
        />
      </ScrollPanel>
      <Divider align="center">
        <span class="text-sm text-muted-color">or</span>
      </Divider>
    </PreviewDemo>
  </div>
</template>
