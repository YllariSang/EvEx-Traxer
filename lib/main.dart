import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:archive/archive.dart';
import 'package:desktop_drop/desktop_drop.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _appLogoAsset = 'assets/images/evex_traxer_app_icon.png';

void main() {
  runApp(const RunSheetApp());
}

class RunSheetApp extends StatelessWidget {
  const RunSheetApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'EvExTraxer Run Sheet',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1B6B4A)),
        useMaterial3: true,
      ),
      home: const WorkDashboardPage(),
    );
  }
}

class AppLogoTitle extends StatelessWidget {
  const AppLogoTitle({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Image.asset(
          _appLogoAsset,
          width: 24,
          height: 24,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

enum SaveState { idle, saving, saved, error }
enum DashboardSort { lastUpdated, newest, name }
enum ImportMode { merge, replace }
enum PhotoFit { contain, cover }

class WorkDashboardPage extends StatefulWidget {
  const WorkDashboardPage({super.key});

  @override
  State<WorkDashboardPage> createState() => _WorkDashboardPageState();
}

class _WorkDashboardPageState extends State<WorkDashboardPage> {
  List<WorkSheet> _works = [];
  bool _loading = true;
  SaveState _saveState = SaveState.idle;
  String _saveMessage = 'Idle';
  String _searchQuery = '';
  DashboardSort _sort = DashboardSort.lastUpdated;

  @override
  void initState() {
    super.initState();
    _loadWorks();
  }

  Future<void> _loadWorks() async {
    final works = await WorkStorage.loadWorks();
    if (!mounted) return;

    setState(() {
      _works = works.isEmpty
          ? [
              WorkSheet(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                name: 'PhilHealth - Mother Ignacia',
                data: RunSheetData.seed(),
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
            ]
          : works;
      _loading = false;
    });

    await _saveWorks();
  }

  Future<bool> _saveWorks() async {
    setState(() {
      _saveState = SaveState.saving;
      _saveMessage = 'Saving...';
    });

    try {
      await WorkStorage.saveWorks(_works);
      if (!mounted) return true;
      setState(() {
        _saveState = SaveState.saved;
        _saveMessage = 'Saved ${DateFormat('h:mm:ss a').format(DateTime.now())}';
      });
      return true;
    } catch (error) {
      if (!mounted) return false;
      setState(() {
        _saveState = SaveState.error;
        _saveMessage = 'Save failed';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Save failed: $error')),
      );
      return false;
    }
  }

  Future<void> _createWork() async {
    final name = await _askForText(
      title: 'Create Work',
      hintText: 'Enter work name',
      initialValue: 'New Event Work',
    );
    if (name == null || name.trim().isEmpty) {
      return;
    }

    setState(() {
      _works.insert(
        0,
        WorkSheet(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          name: name.trim(),
          data: RunSheetData.seed(),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
    });
    await _saveWorks();
  }

  Future<void> _renameWork(String id) async {
    final index = _works.indexWhere((work) => work.id == id);
    if (index < 0) return;

    final renamed = await _askForText(
      title: 'Rename Work',
      hintText: 'Enter new name',
      initialValue: _works[index].name,
    );
    if (renamed == null || renamed.trim().isEmpty) {
      return;
    }

    setState(() {
      _works[index].name = renamed.trim();
      _works[index].updatedAt = DateTime.now();
    });
    await _saveWorks();
  }

  Future<void> _duplicateWork(String id) async {
    final original = _works.where((work) => work.id == id).firstOrNull;
    if (original == null) return;

    final clone = WorkSheet.fromJson(original.toJson());
    clone.id = DateTime.now().millisecondsSinceEpoch.toString();
    clone.name = '${original.name} (Copy)';
    clone.createdAt = DateTime.now();
    clone.updatedAt = DateTime.now();

    setState(() => _works.insert(0, clone));
    await _saveWorks();
  }

  Future<void> _deleteWork(String id) async {
    if (_works.length == 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('At least one work is required.')),
      );
      return;
    }

    final index = _works.indexWhere((work) => work.id == id);
    if (index < 0) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Work'),
        content: Text('Delete "${_works[index].name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );

    if (confirmed != true) return;

    final removed = _works[index];
    setState(() => _works.removeAt(index));
    await _saveWorks();

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Deleted ${removed.name}'),
        showCloseIcon: true,
        action: SnackBarAction(
          label: 'Undo',
          onPressed: () async {
            setState(() => _works.insert(index, removed));
            await _saveWorks();
          },
        ),
      ),
    );
  }

  Future<void> _exportWorks() async {
    final path = await WorkStorage.exportWorks(_works);
    if (path == null || !mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Exported to $path')),
    );
  }

  Future<void> _importWorks() async {
    final mode = await _askImportMode();
    if (mode == null) return;

    try {
      final result = await WorkStorage.importWorks(existingWorks: _works, mode: mode);
      if (result == null || !mounted) return;

      setState(() => _works = result.works);
      await _saveWorks();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Imported ${result.importedCount} works and ${result.photosCopied} photos.'),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Import failed: $error')),
      );
    }
  }

  Future<ImportMode?> _askImportMode() async {
    return showDialog<ImportMode>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Import Mode'),
        content: const Text('Choose how imported works should be applied.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          OutlinedButton(
            onPressed: () => Navigator.pop(context, ImportMode.merge),
            child: const Text('Merge'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, ImportMode.replace),
            child: const Text('Replace'),
          ),
        ],
      ),
    );
  }

  Future<String?> _askForText({
    required String title,
    required String hintText,
    required String initialValue,
  }) async {
    var draft = initialValue;
    final value = await showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(title),
          content: TextFormField(
            initialValue: initialValue,
            autofocus: true,
            decoration: InputDecoration(hintText: hintText),
            onChanged: (text) => draft = text,
            onFieldSubmitted: (text) => Navigator.of(context).pop(text),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.of(context).pop(draft), child: const Text('Save')),
          ],
        );
      },
    );
    return value;
  }

  List<WorkSheet> get _visibleWorks {
    final query = _searchQuery.trim().toLowerCase();
    final filtered = _works.where((work) {
      if (query.isEmpty) return true;
      return work.name.toLowerCase().contains(query) || work.data.venue.toLowerCase().contains(query);
    }).toList();

    filtered.sort((a, b) {
      switch (_sort) {
        case DashboardSort.lastUpdated:
          return b.updatedAt.compareTo(a.updatedAt);
        case DashboardSort.newest:
          return b.createdAt.compareTo(a.createdAt);
        case DashboardSort.name:
          return a.name.toLowerCase().compareTo(b.name.toLowerCase());
      }
    });

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('MMM d, yyyy h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const AppLogoTitle(text: 'EvExTraxer Dashboard'),
        actions: [
          IconButton(onPressed: _importWorks, icon: const Icon(Icons.file_upload_outlined), tooltip: 'Import works'),
          IconButton(onPressed: _exportWorks, icon: const Icon(Icons.download_outlined), tooltip: 'Export works'),
          IconButton(onPressed: _createWork, icon: const Icon(Icons.add_circle_outline), tooltip: 'New work'),
          const SizedBox(width: 8),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: 'Search work name or venue',
                          prefixIcon: Icon(Icons.search),
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (value) => setState(() => _searchQuery = value),
                      ),
                    ),
                    const SizedBox(width: 8),
                    DropdownButton<DashboardSort>(
                      value: _sort,
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => _sort = value);
                        }
                      },
                      items: const [
                        DropdownMenuItem(value: DashboardSort.lastUpdated, child: Text('Updated')),
                        DropdownMenuItem(value: DashboardSort.newest, child: Text('Newest')),
                        DropdownMenuItem(value: DashboardSort.name, child: Text('Name')),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Quick Guide', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                        SizedBox(height: 8),
                        Text('1) Create a work.'),
                        Text('2) Open it and fill event/product cards.'),
                        Text('3) Add or drag product photos.'),
                        Text('4) Print from Print Preview tab.'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                ..._visibleWorks.map((work) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      title: Text(work.name),
                      subtitle: Text(
                        'Venue: ${work.data.venue}\nUpdated: ${formatter.format(work.updatedAt)}',
                      ),
                      isThreeLine: true,
                      trailing: Wrap(
                        spacing: 4,
                        children: [
                          IconButton(
                            onPressed: () => _renameWork(work.id),
                            icon: const Icon(Icons.edit_outlined),
                            tooltip: 'Rename',
                          ),
                          IconButton(
                            onPressed: () => _duplicateWork(work.id),
                            icon: const Icon(Icons.copy_outlined),
                            tooltip: 'Duplicate',
                          ),
                          IconButton(
                            onPressed: () => _deleteWork(work.id),
                            icon: const Icon(Icons.delete_outline),
                            tooltip: 'Delete',
                          ),
                          FilledButton(
                            onPressed: () async {
                              await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => RunSheetEditorPage(
                                    work: work,
                                    onSaveRequested: _saveWorks,
                                  ),
                                ),
                              );
                              setState(() {});
                              await _saveWorks();
                            },
                            child: const Text('Open'),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 8),
                SaveStateBanner(state: _saveState, message: _saveMessage),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createWork,
        icon: const Icon(Icons.add),
        label: const Text('New Work'),
      ),
    );
  }
}

class RunSheetEditorPage extends StatefulWidget {
  const RunSheetEditorPage({
    super.key,
    required this.work,
    required this.onSaveRequested,
  });

  final WorkSheet work;
  final Future<bool> Function() onSaveRequested;

  @override
  State<RunSheetEditorPage> createState() => _RunSheetEditorPageState();
}

class _RunSheetEditorPageState extends State<RunSheetEditorPage> {
  late final RunSheetData _data;
  SaveState _saveState = SaveState.idle;
  String _saveMessage = 'Idle';
  Timer? _saveDebounce;
  Timer? _previewDebounce;
  double _formZoom = 1.0;
  double _pdfZoom = 1.0;
  int _pdfRevision = 0;
  bool _useSplitView = false;

  @override
  void initState() {
    super.initState();
    _data = widget.work.data;
  }

  @override
  void dispose() {
    _saveDebounce?.cancel();
    _previewDebounce?.cancel();
    super.dispose();
  }

  void _apply(void Function() update) {
    setState(() {
      update();
      widget.work.updatedAt = DateTime.now();
      _saveState = SaveState.saving;
      _saveMessage = 'Saving...';
    });

    // Rebuild PDF preview at a lower frequency to avoid heavy redraws.
    _previewDebounce?.cancel();
    _previewDebounce = Timer(const Duration(milliseconds: 450), () {
      if (!mounted) return;
      setState(() => _pdfRevision++);
    });

    _saveDebounce?.cancel();
    _saveDebounce = Timer(const Duration(milliseconds: 350), () async {
      final ok = await widget.onSaveRequested();
      if (!mounted) return;
      setState(() {
        _saveState = ok ? SaveState.saved : SaveState.error;
        _saveMessage = ok ? 'Saved ${DateFormat('h:mm:ss a').format(DateTime.now())}' : 'Save failed';
      });
    });
  }

  Future<void> _pickDateTimeLine() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(now));
    if (time == null) return;

    final combined = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    final line = DateFormat('d, MMMM yyyy | h:mm a').format(combined);
    _apply(() => _data.dateLine = line);
  }

  Future<void> _pickEventTime(EventEntry event) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked == null) return;
    final dt = DateTime(2024, 1, 1, picked.hour, picked.minute);
    _apply(() => event.time = DateFormat('h:mm a').format(dt).toLowerCase());
  }

  Future<void> _importProductPhoto(ProductEntry product, String sourcePath) async {
    final relative = await WorkStorage.importPhoto(sourcePath);
    _apply(() => product.photoPath = relative);
  }

  List<String> _validationErrors() {
    final errors = <String>[];

    if (_data.venue.trim().isEmpty) errors.add('Venue title is required.');
    if (_data.dateLine.trim().isEmpty) errors.add('Date line is required.');
    if (_data.address.trim().isEmpty) errors.add('Address is required.');

    for (var i = 0; i < _data.events.length; i++) {
      final event = _data.events[i];
      if (event.time.trim().isEmpty || event.activity.trim().isEmpty) {
        errors.add('Event card ${i + 1} requires time and activity.');
      }
    }

    for (var i = 0; i < _data.products.length; i++) {
      final product = _data.products[i];
      if (product.price.isNotEmpty && int.tryParse(product.price) == null) {
        errors.add('Product card ${i + 1}: price must be numeric.');
      }
      if (product.discountedPrice.isNotEmpty && int.tryParse(product.discountedPrice) == null) {
        errors.add('Product card ${i + 1}: discounted price must be numeric.');
      }
      if (product.sold.isNotEmpty && int.tryParse(product.sold) == null) {
        errors.add('Product card ${i + 1}: sold must be numeric.');
      }
      if (product.qty.isNotEmpty && int.tryParse(product.qty) == null) {
        errors.add('Product card ${i + 1}: qty must be numeric.');
      }
    }

    return errors;
  }

  Future<Uint8List> _buildPdf(PdfPageFormat pageFormat) async {
    final doc = pw.Document();

    final leftLogo = pw.MemoryImage((await rootBundle.load('assets/images/logo_left.png')).buffer.asUint8List());
    final rightLogo = pw.MemoryImage((await rootBundle.load('assets/images/logo_right.png')).buffer.asUint8List());

    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.letter,
        margin: const pw.EdgeInsets.fromLTRB(28, 28, 28, 20),
        header: (_) => _buildPdfHeader(leftLogo, rightLogo),
        footer: (_) => _buildPdfFooter(),
        build: (_) => [..._buildEventSectionWidgets(), pw.SizedBox(height: 14), _buildProductSection()],
      ),
    );

    return doc.save();
  }

  pw.Widget _buildPdfHeader(pw.MemoryImage leftLogo, pw.MemoryImage rightLogo) {
    return pw.Column(
      children: [
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.SizedBox(width: 120, child: pw.Image(leftLogo, fit: pw.BoxFit.contain)),
            pw.Expanded(
              child: pw.Column(
                children: [
                  pw.Text('INFARMCO GROUP', style: pw.TextStyle(fontSize: 19, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 4),
                  pw.Text('WONDERZYME INC.', style: pw.TextStyle(fontSize: 15, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 4),
                  pw.Text('Marketing Department', style: const pw.TextStyle(fontSize: 13)),
                ],
              ),
            ),
            pw.SizedBox(width: 130, child: pw.Image(rightLogo, fit: pw.BoxFit.contain)),
          ],
        ),
        pw.SizedBox(height: 14),
      ],
    );
  }

  pw.Widget _buildPdfFooter() {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(top: 8),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text('Prepared By: ${_data.preparedBy}', style: const pw.TextStyle(fontSize: 12)),
          pw.Text('Noted By: ${_data.notedBy}', style: const pw.TextStyle(fontSize: 12)),
          pw.Text('Checked By: ${_data.checkedBy}', style: const pw.TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  List<pw.Widget> _buildEventSectionWidgets() {
    final rows = _data.events
        .where((event) {
          final hasTime = event.time.trim().isNotEmpty;
          final hasActivity = event.activity.trim().isNotEmpty;
          return hasTime || hasActivity;
        })
        .map((event) {
          final activity = event.activity.trim();
          final location = event.location.trim();
          final activityCell = activity.isEmpty
              ? location
              : (location.isEmpty ? activity : '$activity\n$location');
          return [event.time.trim(), activityCell];
        })
        .toList();

    final widgets = <pw.Widget>[
        pw.Text(_data.venue, style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 4),
        pw.Text(_data.dateLine, style: const pw.TextStyle(fontSize: 15)),
        pw.SizedBox(height: 8),
        pw.Text(_data.address, style: const pw.TextStyle(fontSize: 14)),
        pw.SizedBox(height: 16),
        pw.Text(_data.scheduleTitle, style: pw.TextStyle(fontSize: 15, fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 8),
    ];

    if (rows.isEmpty) {
      widgets.add(pw.Text('No event cards added yet.', style: const pw.TextStyle(fontSize: 11)));
      return widgets;
    }

    widgets.add(
      pw.TableHelper.fromTextArray(
        border: pw.TableBorder.all(color: PdfColors.grey700, width: 0.6),
        headerDecoration: const pw.BoxDecoration(color: PdfColors.grey300),
        cellPadding: const pw.EdgeInsets.all(8),
        columnWidths: {0: const pw.FixedColumnWidth(110), 1: const pw.FlexColumnWidth()},
        headers: const ['Time', 'Activity'],
        data: rows,
        headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12),
        cellStyle: const pw.TextStyle(fontSize: 12),
        cellAlignments: {0: pw.Alignment.topLeft, 1: pw.Alignment.topLeft},
      ),
    );

    return widgets;
  }

  pw.Widget _buildProductSection() {
    final headerStyle = pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11);
    const cellStyle = pw.TextStyle(fontSize: 10.5);

    final rows = <pw.TableRow>[
      pw.TableRow(
        decoration: const pw.BoxDecoration(color: PdfColors.grey100),
        children: [
          _pdfCell('Price', headerStyle),
          _pdfCell('Discounted', headerStyle),
          _pdfCell('Product Name', headerStyle),
          _pdfCell('Variant/Scent', headerStyle),
          _pdfCell('Size', headerStyle),
          _pdfCell('QTY', headerStyle),
          _pdfCell('Sold', headerStyle),
          _pdfCell('PIC', headerStyle),
        ],
      ),
    ];

    for (final product in _data.products) {
      final isEmptyCard =
          product.price.trim().isEmpty &&
          product.discountedPrice.trim().isEmpty &&
          product.sold.trim().isEmpty &&
          product.productName.trim().isEmpty &&
          product.variant.trim().isEmpty &&
          product.size.trim().isEmpty &&
          product.qty.trim().isEmpty &&
          product.photoPath.trim().isEmpty;
      if (isEmptyCard) continue;

      pw.Widget picCell = _pdfCell('', cellStyle);
      if (product.photoPath.isNotEmpty) {
        final photoPath = WorkStorage.resolvePhotoPathSync(product.photoPath);
        if (photoPath.isNotEmpty) {
          final file = File(photoPath);
          if (file.existsSync()) {
            final image = pw.MemoryImage(file.readAsBytesSync());
            picCell = pw.Container(
              height: 58,
              alignment: pw.Alignment.center,
              child: pw.Image(
                image,
                fit: product.photoFit == PhotoFit.cover ? pw.BoxFit.cover : pw.BoxFit.contain,
              ),
            );
          }
        }
      }

      rows.add(
        pw.TableRow(
          children: [
            _pdfCell(product.price, cellStyle),
            _pdfCell(product.discountedPrice, cellStyle),
            _pdfCell(product.productName, cellStyle),
            _pdfCell(product.variant, cellStyle),
            _pdfCell(product.size, cellStyle),
            _pdfCell(product.qty, cellStyle),
            _pdfCell(product.sold, cellStyle),
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: picCell),
          ],
        ),
      );
    }

    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.6),
      columnWidths: {
        0: const pw.FixedColumnWidth(52),
        1: const pw.FixedColumnWidth(52),
        2: const pw.FixedColumnWidth(142),
        3: const pw.FixedColumnWidth(78),
        4: const pw.FixedColumnWidth(50),
        5: const pw.FixedColumnWidth(35),
        6: const pw.FixedColumnWidth(46),
        7: const pw.FixedColumnWidth(76),
      },
      children: rows,
    );
  }

  pw.Widget _pdfCell(String text, pw.TextStyle style) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(6),
      child: pw.Text(text, style: style),
    );
  }

  @override
  Widget build(BuildContext context) {
    final errors = _validationErrors();

    if (_useSplitView) {
      return Scaffold(
        appBar: AppBar(
          title: AppLogoTitle(text: widget.work.name),
          actions: [
            SaveStateChip(state: _saveState, message: _saveMessage),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () => setState(() => _useSplitView = false),
              icon: const Icon(Icons.view_agenda),
              tooltip: 'Switch to Tabbed View',
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: Row(
          children: [
            // LEFT SIDE: Editor
            Expanded(
              child: DefaultTabController(
                length: 2,
                child: Column(
                  children: [
                    TabBar(
                      tabs: const [
                        Tab(text: 'Event Cards'),
                        Tab(text: 'Product Cards'),
                      ],
                    ),
                    Expanded(
                      child: TabBarView(
                        children: [
                          _buildZoomableEditor(_buildEventEditor()),
                          _buildZoomableEditor(_buildProductEditor()),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // DIVIDER
            VerticalDivider(width: 1, thickness: 1, color: Colors.grey[300]),
            // RIGHT SIDE: PDF Preview
            Expanded(
              child: Column(
                children: [
                  _buildPdfZoomControls(),
                  if (errors.isNotEmpty)
                    Container(
                      width: double.infinity,
                      color: Colors.orange.shade100,
                      padding: const EdgeInsets.all(10),
                      child: Text('Validation: ${errors.join(' | ')}', style: const TextStyle(fontSize: 12)),
                    ),
                  Expanded(
                    child: _buildLivePdfPreview(),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: AppLogoTitle(text: widget.work.name),
          actions: [
            SaveStateChip(state: _saveState, message: _saveMessage),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () => setState(() => _useSplitView = true),
              icon: const Icon(Icons.view_week),
              tooltip: 'Switch to Split View',
            ),
            const SizedBox(width: 8),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Event Cards'),
              Tab(text: 'Product Cards'),
              Tab(text: 'Print Preview'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildZoomableEditor(_buildEventEditor()),
            _buildZoomableEditor(_buildProductEditor()),
            Column(
              children: [
                _buildPdfZoomControls(),
                if (errors.isNotEmpty)
                  Container(
                    width: double.infinity,
                    color: Colors.orange.shade100,
                    padding: const EdgeInsets.all(10),
                    child: Text('Validation: ${errors.join(' | ')}'),
                  ),
                Expanded(
                  child: _buildLivePdfPreview(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildZoomableEditor(Widget child) {
    return Zoom(
      zoomFactor: _formZoom,
      child: child,
    );
  }

  Widget _buildLivePdfPreview() {
    return ClipRect(
      child: Transform.scale(
        scale: _pdfZoom,
        alignment: Alignment.topCenter,
        child: PdfPreview(
          key: ValueKey(_pdfRevision),
          build: _buildPdf,
          canChangePageFormat: false,
          canChangeOrientation: false,
          canDebug: false,
        ),
      ),
    );
  }

  Widget _buildPdfZoomControls() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      color: Colors.grey[100],
      child: Row(
        children: [
          const Text('Form Zoom:', style: TextStyle(fontSize: 12)),
          const SizedBox(width: 8),
          IconButton(
            onPressed: () => setState(() => _formZoom = (_formZoom - 0.1).clamp(0.5, 2.0)),
            icon: const Icon(Icons.remove),
            tooltip: 'Zoom out',
            iconSize: 18,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            padding: EdgeInsets.zero,
          ),
          SizedBox(
            width: 45,
            child: Text('${(_formZoom * 100).toStringAsFixed(0)}%', style: const TextStyle(fontSize: 12), textAlign: TextAlign.center),
          ),
          IconButton(
            onPressed: () => setState(() => _formZoom = (_formZoom + 0.1).clamp(0.5, 2.0)),
            icon: const Icon(Icons.add),
            tooltip: 'Zoom in',
            iconSize: 18,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            padding: EdgeInsets.zero,
          ),
          const SizedBox(width: 16),
          const Text('PDF Zoom:', style: TextStyle(fontSize: 12)),
          const SizedBox(width: 8),
          IconButton(
            onPressed: () => setState(() => _pdfZoom = (_pdfZoom - 0.1).clamp(0.5, 2.0)),
            icon: const Icon(Icons.remove),
            tooltip: 'Zoom out',
            iconSize: 18,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            padding: EdgeInsets.zero,
          ),
          SizedBox(
            width: 45,
            child: Text('${(_pdfZoom * 100).toStringAsFixed(0)}%', style: const TextStyle(fontSize: 12), textAlign: TextAlign.center),
          ),
          IconButton(
            onPressed: () => setState(() => _pdfZoom = (_pdfZoom + 0.1).clamp(0.5, 2.0)),
            icon: const Icon(Icons.add),
            tooltip: 'Zoom in',
            iconSize: 18,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            padding: EdgeInsets.zero,
          ),
          const Spacer(),
          IconButton(
            onPressed: () => setState(() {
              _formZoom = 1.0;
              _pdfZoom = 1.0;
            }),
            icon: const Icon(Icons.refresh),
            tooltip: 'Reset zoom',
            iconSize: 18,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }

  Widget _buildEventEditor() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                _textField(
                  label: 'Venue Title',
                  value: _data.venue,
                  onChanged: (value) => _apply(() => _data.venue = value),
                ),
                Row(
                  children: [
                    Expanded(
                      child: _textField(
                        label: 'Date Line',
                        value: _data.dateLine,
                        onChanged: (value) => _apply(() => _data.dateLine = value),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton.icon(
                      onPressed: _pickDateTimeLine,
                      icon: const Icon(Icons.event),
                      label: const Text('Pick'),
                    ),
                  ],
                ),
                _textField(
                  label: 'Address',
                  value: _data.address,
                  onChanged: (value) => _apply(() => _data.address = value),
                ),
                _textField(
                  label: 'Schedule Title',
                  value: _data.scheduleTitle,
                  onChanged: (value) => _apply(() => _data.scheduleTitle = value),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        ..._data.events.asMap().entries.map((entry) {
          final index = entry.key;
          final event = entry.value;
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Event Card ${index + 1}', style: Theme.of(context).textTheme.titleMedium),
                      IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () => _apply(() => _data.events.removeAt(index)),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: _textField(
                          label: 'Time',
                          value: event.time,
                          onChanged: (value) => _apply(() => event.time = value),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () => _pickEventTime(event),
                        child: const Text('Pick Time'),
                      ),
                    ],
                  ),
                  _textField(
                    label: 'Activity',
                    value: event.activity,
                    maxLines: 6,
                    onChanged: (value) => _apply(() => event.activity = value),
                  ),
                  _textField(
                    label: 'Location / Notes',
                    value: event.location,
                    onChanged: (value) => _apply(() => event.location = value),
                  ),
                ],
              ),
            ),
          );
        }),
        FilledButton.icon(
          onPressed: () => _apply(() => _data.events.add(EventEntry.empty())),
          icon: const Icon(Icons.add),
          label: const Text('Add Event Card'),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                _textField(
                  label: 'Prepared By',
                  value: _data.preparedBy,
                  onChanged: (value) => _apply(() => _data.preparedBy = value),
                ),
                _textField(
                  label: 'Noted By',
                  value: _data.notedBy,
                  onChanged: (value) => _apply(() => _data.notedBy = value),
                ),
                _textField(
                  label: 'Checked By',
                  value: _data.checkedBy,
                  onChanged: (value) => _apply(() => _data.checkedBy = value),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProductEditor() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ..._data.products.asMap().entries.map((entry) {
          final index = entry.key;
          final product = entry.value;
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Product Card ${index + 1}', style: Theme.of(context).textTheme.titleMedium),
                      IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () => _apply(() => _data.products.removeAt(index)),
                      ),
                    ],
                  ),
                  _textField(
                    label: 'Price',
                    value: product.price,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (value) => _apply(() => product.price = value),
                  ),
                  _textField(
                    label: 'Sold',
                    value: product.sold,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (value) => _apply(() => product.sold = value),
                  ),
                  _textField(
                    label: 'Discounted Price',
                    value: product.discountedPrice,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (value) => _apply(() => product.discountedPrice = value),
                  ),
                  _textField(
                    label: 'Product Name',
                    value: product.productName,
                    onChanged: (value) => _apply(() => product.productName = value),
                  ),
                  _textField(
                    label: 'Variant / Scent',
                    value: product.variant,
                    onChanged: (value) => _apply(() => product.variant = value),
                  ),
                  _textField(
                    label: 'Size',
                    value: product.size,
                    onChanged: (value) => _apply(() => product.size = value),
                  ),
                  _textField(
                    label: 'QTY',
                    value: product.qty,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (value) => _apply(() => product.qty = value),
                  ),
                  ProductPhotoDropZone(
                    currentPath: product.photoPath,
                    photoFit: product.photoFit,
                    onPathPicked: (sourcePath) => _importProductPhoto(product, sourcePath),
                    onPhotoFitChanged: (fit) => _apply(() => product.photoFit = fit),
                    onRemove: () => _apply(() => product.photoPath = ''),
                  ),
                ],
              ),
            ),
          );
        }),
        FilledButton.icon(
          onPressed: () => _apply(() => _data.products.add(ProductEntry.empty())),
          icon: const Icon(Icons.add),
          label: const Text('Add Product Card'),
        ),
      ],
    );
  }

  Widget _textField({
    required String label,
    required String value,
    required ValueChanged<String> onChanged,
    int maxLines = 1,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: BoundTextField(
        label: label,
        value: value,
        maxLines: maxLines,
        keyboardType: keyboardType,
        inputFormatters: inputFormatters,
        onChanged: onChanged,
      ),
    );
  }
}

class ProductPhotoDropZone extends StatefulWidget {
  const ProductPhotoDropZone({
    super.key,
    required this.currentPath,
    required this.photoFit,
    required this.onPathPicked,
    required this.onPhotoFitChanged,
    required this.onRemove,
  });

  final String currentPath;
  final PhotoFit photoFit;
  final Future<void> Function(String sourcePath) onPathPicked;
  final ValueChanged<PhotoFit> onPhotoFitChanged;
  final VoidCallback onRemove;

  @override
  State<ProductPhotoDropZone> createState() => _ProductPhotoDropZoneState();
}

class _ProductPhotoDropZoneState extends State<ProductPhotoDropZone> {
  bool _dragging = false;
  bool _busy = false;

  Future<void> _pickImage() async {
    final picked = await FilePicker.platform.pickFiles(type: FileType.image, allowMultiple: false);
    final path = picked?.files.single.path;
    if (path == null) return;

    setState(() => _busy = true);
    try {
      await widget.onPathPicked(path);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final resolvedPath = WorkStorage.resolvePhotoPathSync(widget.currentPath);
    final exists = resolvedPath.isNotEmpty && File(resolvedPath).existsSync();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Product Photo', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 6),
        DropTarget(
          onDragEntered: (_) => setState(() => _dragging = true),
          onDragExited: (_) => setState(() => _dragging = false),
          onDragDone: (details) async {
            setState(() => _dragging = false);
            if (details.files.isEmpty) return;

            setState(() => _busy = true);
            try {
              await widget.onPathPicked(details.files.first.path);
            } finally {
              if (mounted) {
                setState(() => _busy = false);
              }
            }
          },
          child: InkWell(
            onTap: _busy ? null : _pickImage,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(
                  color: _dragging ? Theme.of(context).colorScheme.primary : Colors.grey,
                  width: _dragging ? 2 : 1,
                ),
                borderRadius: BorderRadius.circular(10),
                color: _dragging ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.08) : null,
              ),
              child: _busy
                  ? const Center(child: CircularProgressIndicator())
                  : exists
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (!kIsWeb)
                              Image.file(
                                File(resolvedPath),
                                height: 100,
                                fit: BoxFit.contain,
                              ),
                            const SizedBox(height: 8),
                            Text('File: ${resolvedPath.split(Platform.pathSeparator).last}'),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: _pickImage,
                                  icon: const Icon(Icons.upload_file),
                                  label: const Text('Replace'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: widget.onRemove,
                                  icon: const Icon(Icons.delete_outline),
                                  label: const Text('Remove'),
                                ),
                              ],
                            ),
                          ],
                        )
                      : const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.photo_camera_back_outlined),
                            SizedBox(height: 8),
                            Text('Drag and drop a product image here'),
                            SizedBox(height: 2),
                            Text('or click this box to choose an image file'),
                          ],
                        ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Text('Print fit: '),
            SegmentedButton<PhotoFit>(
              segments: const [
                ButtonSegment(value: PhotoFit.contain, label: Text('Contain')),
                ButtonSegment(value: PhotoFit.cover, label: Text('Fill')),
              ],
              selected: {widget.photoFit},
              onSelectionChanged: (selection) {
                widget.onPhotoFitChanged(selection.first);
              },
            ),
          ],
        ),
      ],
    );
  }
}

class SaveStateBanner extends StatelessWidget {
  const SaveStateBanner({super.key, required this.state, required this.message});

  final SaveState state;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SaveStateChip(state: state, message: message),
      ],
    );
  }
}

class SaveStateChip extends StatelessWidget {
  const SaveStateChip({super.key, required this.state, required this.message});

  final SaveState state;
  final String message;

  @override
  Widget build(BuildContext context) {
    final color = switch (state) {
      SaveState.idle => Colors.grey,
      SaveState.saving => Colors.blue,
      SaveState.saved => Colors.green,
      SaveState.error => Colors.red,
    };

    return Chip(
      label: Text(message),
      backgroundColor: color.withValues(alpha: 0.15),
      side: BorderSide(color: color.withValues(alpha: 0.4)),
      avatar: Icon(Icons.circle, color: color, size: 10),
    );
  }
}

class BoundTextField extends StatefulWidget {
  const BoundTextField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.maxLines = 1,
    this.keyboardType,
    this.inputFormatters,
  });

  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  final int maxLines;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;

  @override
  State<BoundTextField> createState() => _BoundTextFieldState();
}

class _BoundTextFieldState extends State<BoundTextField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
  }

  @override
  void didUpdateWidget(covariant BoundTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _controller.text) {
      _controller.value = TextEditingValue(
        text: widget.value,
        selection: TextSelection.collapsed(offset: widget.value.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: _controller,
      maxLines: widget.maxLines,
      keyboardType: widget.keyboardType,
      inputFormatters: widget.inputFormatters,
      onChanged: widget.onChanged,
      decoration: InputDecoration(
        labelText: widget.label,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
    );
  }
}

class ImportResult {
  ImportResult({required this.works, required this.importedCount, required this.photosCopied});

  final List<WorkSheet> works;
  final int importedCount;
  final int photosCopied;
}

class WorkStorage {
  static const _storageKey = 'evextraxer_works_v1';
  static Directory? _cachedBaseDir;

  static Future<Directory> _baseDir() async {
    if (_cachedBaseDir != null) return _cachedBaseDir!;

    final support = await getApplicationSupportDirectory();
    final dir = Directory('${support.path}${Platform.pathSeparator}evextraxer_data');
    if (!dir.existsSync()) {
      await dir.create(recursive: true);
    }
    _cachedBaseDir = dir;
    return dir;
  }

  static Future<Directory> _photosDir() async {
    final base = await _baseDir();
    final dir = Directory('${base.path}${Platform.pathSeparator}photos');
    if (!dir.existsSync()) {
      await dir.create(recursive: true);
    }
    return dir;
  }

  static bool _isAbsolutePath(String path) {
    if (path.startsWith('/') || path.startsWith('\\')) return true;
    if (path.length > 2 && path[1] == ':' && (path[2] == '\\' || path[2] == '/')) return true;
    return false;
  }

  static String resolvePhotoPathSync(String pathRef) {
    if (pathRef.isEmpty) return '';
    if (_isAbsolutePath(pathRef)) return pathRef;

    final base = _cachedBaseDir;
    if (base == null) {
      return pathRef;
    }

    final normalized = pathRef.replaceAll('/', Platform.pathSeparator).replaceAll('\\', Platform.pathSeparator);
    return '${base.path}${Platform.pathSeparator}$normalized';
  }

  static String _newPhotoFileName(String sourcePath) {
    final extension = sourcePath.contains('.') ? sourcePath.substring(sourcePath.lastIndexOf('.')) : '.png';
    return 'img_${DateTime.now().microsecondsSinceEpoch}$extension';
  }

  static Future<String> importPhoto(String sourcePath) async {
    final photos = await _photosDir();
    final fileName = _newPhotoFileName(sourcePath);
    final destination = File('${photos.path}${Platform.pathSeparator}$fileName');
    await File(sourcePath).copy(destination.path);
    return 'photos/$fileName';
  }

  static Future<List<WorkSheet>> loadWorks() async {
    await _baseDir();
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) {
      return [];
    }

    final decoded = jsonDecode(raw);
    if (decoded is! List) {
      return [];
    }

    final works = decoded
        .whereType<Map>()
        .map((item) => WorkSheet.fromJson(item.cast<String, dynamic>()))
        .toList();

    final changed = await _migrateLegacyPhotoPaths(works);
    if (changed) {
      await saveWorks(works);
    }

    return works;
  }

  static Future<bool> _migrateLegacyPhotoPaths(List<WorkSheet> works) async {
    var changed = false;

    for (final work in works) {
      for (final product in work.data.products) {
        final path = product.photoPath;
        if (path.isEmpty) continue;
        if (_isAbsolutePath(path)) {
          final file = File(path);
          if (file.existsSync()) {
            product.photoPath = await importPhoto(path);
            changed = true;
          }
        }
      }
    }

    return changed;
  }

  static Future<void> saveWorks(List<WorkSheet> works) async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(works.map((work) => work.toJson()).toList());
    await prefs.setString(_storageKey, encoded);
  }

  static Future<String?> exportWorks(List<WorkSheet> works) async {
    if (works.isEmpty) return null;

    final savePath = await FilePicker.platform.saveFile(
      dialogTitle: 'Export works',
      fileName: 'evextraxer_export_${DateFormat('yyyyMMdd_HHmmss').format(DateTime.now())}.zip',
      type: FileType.custom,
      allowedExtensions: const ['zip'],
    );
    if (savePath == null) return null;

    final clonedWorks = works.map((work) => WorkSheet.fromJson(work.toJson())).toList();
    final archive = Archive();

    for (final work in clonedWorks) {
      for (final product in work.data.products) {
        if (product.photoPath.isEmpty) continue;

        final absolute = resolvePhotoPathSync(product.photoPath);
        final file = File(absolute);
        if (!file.existsSync()) {
          product.photoPath = '';
          continue;
        }

        var rel = product.photoPath;
        if (_isAbsolutePath(rel) || !rel.startsWith('photos/')) {
          rel = 'photos/${_newPhotoFileName(absolute)}';
          product.photoPath = rel;
        }

        final bytes = file.readAsBytesSync();
        archive.addFile(ArchiveFile(rel, bytes.length, bytes));
      }
    }

    final worksJson = jsonEncode(clonedWorks.map((work) => work.toJson()).toList());
    final worksBytes = utf8.encode(worksJson);
    archive.addFile(ArchiveFile('works.json', worksBytes.length, worksBytes));

    final zipData = ZipEncoder().encode(archive);
    if (zipData == null) return null;

    final out = File(savePath);
    await out.writeAsBytes(zipData, flush: true);
    return out.path;
  }

  static Future<ImportResult?> importWorks({
    required List<WorkSheet> existingWorks,
    required ImportMode mode,
  }) async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['zip'],
      withData: true,
      allowMultiple: false,
    );

    if (picked == null || picked.files.isEmpty) return null;

    final item = picked.files.single;
    final bytes = item.bytes ?? await File(item.path!).readAsBytes();
    final archive = ZipDecoder().decodeBytes(bytes);

    ArchiveFile? worksFile;
    for (final entry in archive.files) {
      if (!entry.isFile) continue;
      if (entry.name == 'works.json' || entry.name.endsWith('/works.json')) {
        worksFile = entry;
        break;
      }
    }

    if (worksFile == null) {
      throw Exception('works.json was not found in this archive.');
    }

    final jsonText = utf8.decode(_archiveFileBytes(worksFile));
    final decoded = jsonDecode(jsonText);
    if (decoded is! List) {
      throw Exception('works.json has invalid content.');
    }

    final imported = decoded
        .whereType<Map>()
        .map((itemMap) => WorkSheet.fromJson(itemMap.cast<String, dynamic>()))
        .toList();

    var photosCopied = 0;
    final photos = await _photosDir();
    final photoMap = <String, String>{};

    for (final entry in archive.files) {
      if (!entry.isFile) continue;
      final name = entry.name.replaceAll('\\', '/');
      if (!name.startsWith('photos/')) continue;

      final newName = _newPhotoFileName(name);
      final relative = 'photos/$newName';
      final outputPath = '${photos.path}${Platform.pathSeparator}$newName';
      await File(outputPath).writeAsBytes(_archiveFileBytes(entry), flush: true);
      photoMap[name] = relative;
      photosCopied++;
    }

    for (final work in imported) {
      work.id = DateTime.now().microsecondsSinceEpoch.toString();
      work.updatedAt = DateTime.now();
      for (final product in work.data.products) {
        final normalized = product.photoPath.replaceAll('\\', '/');
        if (photoMap.containsKey(normalized)) {
          product.photoPath = photoMap[normalized]!;
        } else if (_isAbsolutePath(product.photoPath)) {
          final source = File(product.photoPath);
          if (source.existsSync()) {
            product.photoPath = await importPhoto(product.photoPath);
            photosCopied++;
          } else {
            product.photoPath = '';
          }
        }
      }
    }

    final merged = mergeWorks(existingWorks: existingWorks, importedWorks: imported, mode: mode);
    return ImportResult(works: merged, importedCount: imported.length, photosCopied: photosCopied);
  }

  static List<WorkSheet> mergeWorks({
    required List<WorkSheet> existingWorks,
    required List<WorkSheet> importedWorks,
    required ImportMode mode,
  }) {
    if (mode == ImportMode.replace) {
      return importedWorks;
    }

    final merged = existingWorks.map((work) => WorkSheet.fromJson(work.toJson())).toList();
    for (final work in importedWorks) {
      merged.add(WorkSheet.fromJson(work.toJson()));
    }
    return merged;
  }

  static List<int> _archiveFileBytes(ArchiveFile file) {
    final content = file.content;
    if (content is List<int>) return content;
    if (content is Uint8List) return content.toList();
    if (content is InputStream) return content.toUint8List();
    throw Exception('Unsupported archive content for ${file.name}');
  }
}

class WorkSheet {
  WorkSheet({
    required this.id,
    required this.name,
    required this.data,
    required this.createdAt,
    required this.updatedAt,
  });

  String id;
  String name;
  RunSheetData data;
  DateTime createdAt;
  DateTime updatedAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'data': data.toJson(),
    };
  }

  factory WorkSheet.fromJson(Map<String, dynamic> json) {
    final createdAt = DateTime.tryParse(json['createdAt'] as String? ?? '');
    final updatedAt = DateTime.tryParse(json['updatedAt'] as String? ?? '');

    return WorkSheet(
      id: json['id'] as String? ?? DateTime.now().microsecondsSinceEpoch.toString(),
      name: json['name'] as String? ?? 'Untitled Work',
      data: RunSheetData.fromJson((json['data'] as Map?)?.cast<String, dynamic>() ?? {}),
      createdAt: createdAt ?? DateTime.now(),
      updatedAt: updatedAt ?? createdAt ?? DateTime.now(),
    );
  }
}

class RunSheetData {
  RunSheetData({
    required this.venue,
    required this.dateLine,
    required this.address,
    required this.scheduleTitle,
    required this.preparedBy,
    required this.notedBy,
    required this.checkedBy,
    required this.events,
    required this.products,
  });

  String venue;
  String dateLine;
  String address;
  String scheduleTitle;
  String preparedBy;
  String notedBy;
  String checkedBy;
  List<EventEntry> events;
  List<ProductEntry> products;

  factory RunSheetData.seed() {
    final formatter = DateFormat('d, MMMM yyyy | h:mm a');
    return RunSheetData(
      venue: 'PhilHealth - Mother Ignacia',
      dateLine: formatter.format(DateTime(2026, 3, 23, 9)),
      address: '145 Mother Ignacia Ave, Diliman, Quezon City, Metro Manila',
      scheduleTitle: '13 - 15 MARCH 2025 (FRIDAY - SUNDAY)',
      preparedBy: 'Justin Liao',
      notedBy: 'Joan Acosta',
      checkedBy: 'Ms Marissa Cruz',
      events: [
        EventEntry(
          time: '8:00 am',
          activity:
              'Checking of Items -\n\nFor freebies:\n- PZ Yellow Soap_ 100g_25pcs\n- MP Bamboo_ 100ml_20pcs\n- Madre De Cacao_100g_50pcs\n- PZ Pet Area Spray _ 100ml_200 pcs\n- PZ_PAPERBAG_20PCS\n\nFor Selling:\n- Petzyme_MadreDeCacaoSoap_100grams_25pcs\n- Petzyme_YellowSoap_100g_25pcs\n- Petzyme_BergamotSoap_100g_25pcs\n- Petzyme_OdorEliminator_Vanilla_500ml_40pcs\n- Petzyme_OdorEliminator_Bergamot_500ml_40pcs\n- Petzyme_OdorEliminator_Vanilla_Gallon_4pcs\n- Petzyme_OdorEliminator_Bergamot_Gallon_4pcs',
          location: 'Office - Justin & Friends',
        ),
        EventEntry(
          time: '11:00am-3:00 pm',
          activity:
              'Opening of Program\n- Registration 11:00 am - 12:00 pm\n- 10AM - 3PM - Available Space\n- Selling 11:00am - 9:00PM activity Area\n(Selling point- Maximize)',
          location: 'Ayala Malls Manila Bay - Justin & Friends',
        ),
      ],
      products: [
        ProductEntry(price: '110', discountedPrice: '100', sold: '50', productName: 'Petzyme Madre De Cacao Soap', variant: 'Madre De Cacao', size: '100g', qty: '15', photoPath: '', photoFit: PhotoFit.contain),
        ProductEntry(price: '90', discountedPrice: '80', sold: '45', productName: 'Petzyme Yellow Soap', variant: 'Yellow', size: '100g', qty: '15', photoPath: '', photoFit: PhotoFit.contain),
        ProductEntry(price: '119', discountedPrice: '109', sold: '55', productName: 'Petzyme Bergamot Soap', variant: 'Bergamot', size: '100g', qty: '15', photoPath: '', photoFit: PhotoFit.contain),
      ],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'venue': venue,
      'dateLine': dateLine,
      'address': address,
      'scheduleTitle': scheduleTitle,
      'preparedBy': preparedBy,
      'notedBy': notedBy,
      'checkedBy': checkedBy,
      'events': events.map((event) => event.toJson()).toList(),
      'products': products.map((product) => product.toJson()).toList(),
    };
  }

  factory RunSheetData.fromJson(Map<String, dynamic> json) {
    return RunSheetData(
      venue: json['venue'] as String? ?? '',
      dateLine: json['dateLine'] as String? ?? '',
      address: json['address'] as String? ?? '',
      scheduleTitle: json['scheduleTitle'] as String? ?? '',
      preparedBy: json['preparedBy'] as String? ?? '',
      notedBy: json['notedBy'] as String? ?? '',
      checkedBy: json['checkedBy'] as String? ?? '',
      events: ((json['events'] as List?) ?? []).whereType<Map>().map((event) => EventEntry.fromJson(event.cast<String, dynamic>())).toList(),
      products: ((json['products'] as List?) ?? [])
          .whereType<Map>()
          .map((product) => ProductEntry.fromJson(product.cast<String, dynamic>()))
          .toList(),
    );
  }
}

class EventEntry {
  EventEntry({required this.time, required this.activity, required this.location});

  String time;
  String activity;
  String location;

  factory EventEntry.empty() => EventEntry(time: '', activity: '', location: '');

  Map<String, dynamic> toJson() {
    return {
      'time': time,
      'activity': activity,
      'location': location,
    };
  }

  factory EventEntry.fromJson(Map<String, dynamic> json) {
    return EventEntry(
      time: json['time'] as String? ?? '',
      activity: json['activity'] as String? ?? '',
      location: json['location'] as String? ?? '',
    );
  }
}

class ProductEntry {
  ProductEntry({
    required this.price,
    required this.discountedPrice,
    required this.sold,
    required this.productName,
    required this.variant,
    required this.size,
    required this.qty,
    required this.photoPath,
    required this.photoFit,
  });

  String price;
  String discountedPrice;
  String sold;
  String productName;
  String variant;
  String size;
  String qty;
  String photoPath;
  PhotoFit photoFit;

  factory ProductEntry.empty() {
    return ProductEntry(
      price: '',
      discountedPrice: '',
      sold: '',
      productName: '',
      variant: '',
      size: '',
      qty: '',
      photoPath: '',
      photoFit: PhotoFit.contain,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'price': price,
      'discountedPrice': discountedPrice,
      'sold': sold,
      'productName': productName,
      'variant': variant,
      'size': size,
      'qty': qty,
      'photoPath': photoPath,
      'photoFit': photoFit.name,
    };
  }

  factory ProductEntry.fromJson(Map<String, dynamic> json) {
    final fitName = json['photoFit'] as String? ?? 'contain';
    final fit = PhotoFit.values.where((value) => value.name == fitName).firstOrNull ?? PhotoFit.contain;

    return ProductEntry(
      price: json['price'] as String? ?? '',
      discountedPrice: json['discountedPrice'] as String? ?? '',
      sold: json['sold'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      variant: json['variant'] as String? ?? '',
      size: json['size'] as String? ?? '',
      qty: json['qty'] as String? ?? '',
      photoPath: json['photoPath'] as String? ?? '',
      photoFit: fit,
    );
  }
}

extension FirstOrNullExtension<T> on Iterable<T> {
  T? get firstOrNull {
    if (isEmpty) return null;
    return first;
  }
}

class Zoom extends StatelessWidget {
  const Zoom({
    super.key,
    required this.child,
    required this.zoomFactor,
  });

  final Widget child;
  final double zoomFactor;

  @override
  Widget build(BuildContext context) {
    return Transform.scale(
      scale: zoomFactor,
      alignment: Alignment.topLeft,
      child: child,
    );
  }
}
