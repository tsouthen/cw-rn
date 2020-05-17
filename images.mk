OUTDIR=assets/images
INDIR=assets/svgs

$(OUTDIR)/%@4x.png : $(INDIR)/%.svg
	svgexport $< $@ 400:

$(OUTDIR)/%@3x.png : $(INDIR)/%.svg
	svgexport $< $@ 300:

$(OUTDIR)/%@2x.png : $(INDIR)/%.svg
	svgexport $< $@ 200:

$(OUTDIR)/%.png : $(INDIR)/%.svg
	svgexport $< $@ 100:

INFILES=$(wildcard $(INDIR)/*/*.svg)
OUT1X = $(patsubst $(INDIR)/%.svg,$(OUTDIR)/%.png,$(INFILES))
OUT2X = $(patsubst $(INDIR)/%.svg,$(OUTDIR)/%@2x.png,$(INFILES))
OUT3X = $(patsubst $(INDIR)/%.svg,$(OUTDIR)/%@3x.png,$(INFILES))
OUT4X = $(patsubst $(INDIR)/%.svg,$(OUTDIR)/%@4x.png,$(INFILES))

svgs: $(OUT1X) $(OUT2X) $(OUT3X) $(OUT4X)

report:
	$(info INDIR: $(INDIR))
	$(info OUTDIR: $(OUTDIR))
	$(info INFILES: $(INFILES))
	$(info OUT1X: $(OUT1X))
	$(info OUT2X: $(OUT2X))
	$(info OUT3X: $(OUT3X))
	$(info OUT4X: $(OUT4X))

.PHONY: report svgs
