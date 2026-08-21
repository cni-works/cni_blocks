( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useEffect, useState } = element;
	const { BlockControls, ColorPalette, InspectorControls, RichText, useBlockProps } = blockEditor;
	const { Button, Notice, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl, ToolbarGroup } = components;

	function numberOr( value, fallback ) { return typeof value === 'number' ? value : fallback; }
	function cellId( row, column ) { return 'r' + row + 'c' + column; }
	function newCell( row, column ) { return { id: cellId( row, column ), row: row, column: column, content: '', rowSpan: 1, colSpan: 1, hidden: false, backgroundColor: '', textColor: '', align: 'left', valign: 'middle' }; }
	function createCells( rows, columns ) {
		const cells = [];
		for ( let row = 0; row < rows; row += 1 ) for ( let column = 0; column < columns; column += 1 ) cells.push( newCell( row, column ) );
		return cells;
	}
	function normalizeCells( cells, rows, columns ) {
		const byPosition = {};
		( cells || [] ).forEach( function( cell ) { byPosition[ cell.row + ':' + cell.column ] = cell; } );
		const normalized = [];
		for ( let row = 0; row < rows; row += 1 ) for ( let column = 0; column < columns; column += 1 ) normalized.push( Object.assign( newCell( row, column ), byPosition[ row + ':' + column ] || {}, { id: cellId( row, column ), row: row, column: column } ) );
		return normalized;
	}
	function hasMergedCells( cells ) { return cells.some( function( cell ) { return cell.hidden || cell.rowSpan > 1 || cell.colSpan > 1; } ); }
	function tableStyle( a ) { return { '--cni-table-border-color': a.borderColor || '#dddddd', '--cni-table-border-width': numberOr( a.borderWidth, 1 ) + 'px', '--cni-table-border-style': a.borderStyle || 'solid', '--cni-table-cell-padding': numberOr( a.cellPadding, 12 ) + 'px', '--cni-table-background': a.tableBackgroundColor || 'transparent', '--cni-table-header-background': a.headerBackgroundColor || '#f5f5f5' }; }
	function wrapperProps( a, save ) {
		const props = { style: tableStyle( a ), 'data-mobile-mode': a.mobileMode || 'none', 'data-striped': a.striped ? '1' : '0' };
		return save ? blockEditor.useBlockProps.save( props ) : useBlockProps( props );
	}
	function cellStyle( cell ) {
		const style = { '--cni-cell-align': cell.align || 'left', '--cni-cell-valign': cell.valign || 'middle' };
		if ( cell.backgroundColor ) style[ '--cni-cell-background' ] = cell.backgroundColor;
		if ( cell.textColor ) style[ '--cni-cell-color' ] = cell.textColor;
		return style;
	}
	function rowsFrom( cells, rows ) {
		const result = [];
		for ( let row = 0; row < rows; row += 1 ) result.push( cells.filter( function( cell ) { return cell.row === row && ! cell.hidden; } ).sort( function( left, right ) { return left.column - right.column; } ) );
		return result;
	}
	function headerLabel( cells, column ) {
		const cell = cells.find( function( item ) { return item.row === 0 && item.column === column && ! item.hidden; } );
		return cell ? String( cell.content || '' ).replace( /<[^>]*>/g, '' ) : '';
	}
	function palette( label, value, onChange ) { return el( element.Fragment, null, el( 'p', null, label ), el( ColorPalette, { value: value, clearable: true, onChange: onChange } ) ); }
	function saveTable( a, includeLegacyHint ) {
		const rows = Math.max( 1, numberOr( a.rows, 3 ) ), columns = Math.max( 1, numberOr( a.columns, 3 ) ), cells = normalizeCells( a.cells, rows, columns ), grouped = rowsFrom( cells, rows );
		function renderSavedCell( cell, section ) { const tagName = section === 'head' ? 'th' : 'td'; return el( tagName, { key: cell.id, className: 'cni-table-plus__cell', style: cellStyle( cell ), scope: section === 'head' ? 'col' : undefined, rowSpan: cell.rowSpan > 1 ? cell.rowSpan : undefined, colSpan: cell.colSpan > 1 ? cell.colSpan : undefined, 'data-label': section === 'head' || a.hasHeader === false ? '' : headerLabel( cells, cell.column ) }, el( RichText.Content, { tagName: 'div', value: cell.content || '' } ) ); }
		function section( tagName, indexes, type ) { return indexes.length ? el( tagName, null, indexes.map( function( index ) { return el( 'tr', { key: 'row-' + index }, grouped[ index ].map( function( cell ) { return renderSavedCell( cell, type ); } ) ); } ) ) : null; }
		const bodyStart = a.hasHeader !== false ? 1 : 0, bodyEnd = a.hasFooter && rows > bodyStart ? rows - 1 : rows, bodyRows = Array.from( { length: Math.max( 0, bodyEnd - bodyStart ) }, function( unused, index ) { return bodyStart + index; } );
		const hint = includeLegacyHint && a.showScrollHint !== false && a.mobileMode !== 'stack' ? el( 'p', { className: 'cni-table-plus__scroll-hint' }, '← ' + __( 'スクロールできます', 'cni-blocks' ) + ' →' ) : null;
		return el( 'div', wrapperProps( a, true ), hint, el( 'div', { className: 'cni-table-plus__viewport', tabIndex: a.mobileMode === 'scroll' ? 0 : undefined }, el( 'table', { className: 'cni-table-plus__table' }, a.caption ? el( 'caption', null, a.caption ) : null, a.hasHeader !== false ? section( 'thead', [ 0 ], 'head' ) : null, section( 'tbody', bodyRows, 'body' ), a.hasFooter && rows > bodyStart ? section( 'tfoot', [ rows - 1 ], 'foot' ) : null ) ) );
	}

	blocks.registerBlockType( 'cni-blocks/table-plus', {
		apiVersion: 3, title: __( 'テーブル+', 'cni-blocks' ), icon: 'editor-table', category: 'cni-blocks', description: __( 'セル結合、セル単位の色、モバイル表示を設定できる表です。', 'cni-blocks' ),
		attributes: { rows: { type: 'number', default: 3 }, columns: { type: 'number', default: 3 }, cells: { type: 'array', default: [] }, hasHeader: { type: 'boolean', default: true }, hasFooter: { type: 'boolean', default: false }, caption: { type: 'string', default: '' }, mobileMode: { type: 'string', default: 'none' }, borderStyle: { type: 'string', default: 'solid' }, borderWidth: { type: 'number', default: 1 }, borderColor: { type: 'string', default: '#dddddd' }, cellPadding: { type: 'number', default: 12 }, tableBackgroundColor: { type: 'string', default: '' }, headerBackgroundColor: { type: 'string', default: '#f5f5f5' }, striped: { type: 'boolean', default: false } },
		supports: { align: [ 'wide', 'full' ], anchor: true, html: false },
		edit: function( props ) {
			const a = props.attributes;
			const rows = Math.max( 1, numberOr( a.rows, 3 ) );
			const columns = Math.max( 1, numberOr( a.columns, 3 ) );
			const cells = normalizeCells( a.cells, rows, columns );
			const [ selected, setSelected ] = useState( [] );
			const [ anchor, setAnchor ] = useState( null );
			useEffect( function() { if ( ! a.cells || ! a.cells.length ) props.setAttributes( { cells: createCells( rows, columns ) } ); }, [] );
			const selectedCells = cells.filter( function( cell ) { return selected.indexOf( cell.id ) !== -1; } );
			const activeCell = selectedCells.length === 1 ? selectedCells[ 0 ] : null;
			const merged = hasMergedCells( cells );

			function updateCell( id, changes ) { props.setAttributes( { cells: cells.map( function( cell ) { return cell.id === id ? Object.assign( {}, cell, changes ) : cell; } ) } ); }
			function updateSelectedCells( changes ) { props.setAttributes( { cells: cells.map( function( cell ) { return selected.indexOf( cell.id ) !== -1 ? Object.assign( {}, cell, changes ) : cell; } ) } ); }
			function selectedValue( key ) { if ( ! selectedCells.length ) return ''; const value = selectedCells[ 0 ][ key ] || ''; return selectedCells.every( function( cell ) { return ( cell[ key ] || '' ) === value; } ) ? value : ''; }
			function selectCell( cell, event ) {
				if ( event && event.shiftKey && anchor ) {
					const first = cells.find( function( item ) { return item.id === anchor; } );
					if ( first ) {
						const minRow = Math.min( first.row, cell.row ), maxRow = Math.max( first.row, cell.row ), minColumn = Math.min( first.column, cell.column ), maxColumn = Math.max( first.column, cell.column );
						setSelected( cells.filter( function( item ) { return ! item.hidden && item.row >= minRow && item.row <= maxRow && item.column >= minColumn && item.column <= maxColumn; } ).map( function( item ) { return item.id; } ) );
						return;
					}
				}
				if ( event && ( event.ctrlKey || event.metaKey ) ) { setSelected( selected.indexOf( cell.id ) === -1 ? selected.concat( cell.id ) : selected.filter( function( id ) { return id !== cell.id; } ) ); setAnchor( cell.id ); return; }
				setSelected( [ cell.id ] ); setAnchor( cell.id );
			}
			function canMerge() {
				if ( selectedCells.length < 2 || selectedCells.some( function( cell ) { return cell.hidden || cell.rowSpan > 1 || cell.colSpan > 1; } ) ) return false;
				const rowValues = selectedCells.map( function( cell ) { return cell.row; } ), columnValues = selectedCells.map( function( cell ) { return cell.column; } );
				const crossesHeader = a.hasHeader !== false && rowValues.indexOf( 0 ) !== -1 && rowValues.some( function( row ) { return row !== 0; } );
				const crossesFooter = !! a.hasFooter && rowValues.indexOf( rows - 1 ) !== -1 && rowValues.some( function( row ) { return row !== rows - 1; } );
				if ( crossesHeader || crossesFooter ) return false;
				return ( Math.max.apply( null, rowValues ) - Math.min.apply( null, rowValues ) + 1 ) * ( Math.max.apply( null, columnValues ) - Math.min.apply( null, columnValues ) + 1 ) === selectedCells.length;
			}
			function mergeSelection() {
				if ( ! canMerge() ) return;
				const minRow = Math.min.apply( null, selectedCells.map( function( cell ) { return cell.row; } ) ), maxRow = Math.max.apply( null, selectedCells.map( function( cell ) { return cell.row; } ) ), minColumn = Math.min.apply( null, selectedCells.map( function( cell ) { return cell.column; } ) ), maxColumn = Math.max.apply( null, selectedCells.map( function( cell ) { return cell.column; } ) );
				const masterId = cellId( minRow, minColumn );
				props.setAttributes( { cells: cells.map( function( cell ) { if ( selected.indexOf( cell.id ) === -1 ) return cell; if ( cell.id === masterId ) return Object.assign( {}, cell, { rowSpan: maxRow - minRow + 1, colSpan: maxColumn - minColumn + 1, hidden: false } ); return Object.assign( {}, cell, { hidden: true } ); } ) } );
				setSelected( [ masterId ] ); setAnchor( masterId );
			}
			function unmergeSelection() {
				if ( ! activeCell || ( activeCell.rowSpan <= 1 && activeCell.colSpan <= 1 ) ) return;
				const maxRow = activeCell.row + activeCell.rowSpan - 1, maxColumn = activeCell.column + activeCell.colSpan - 1;
				props.setAttributes( { cells: cells.map( function( cell ) { if ( cell.row >= activeCell.row && cell.row <= maxRow && cell.column >= activeCell.column && cell.column <= maxColumn ) return Object.assign( {}, cell, { hidden: false, rowSpan: 1, colSpan: 1 } ); return cell; } ) } );
			}
			function addRow() { if ( merged || rows >= 30 ) return; props.setAttributes( { rows: rows + 1, cells: cells.concat( Array.from( { length: columns }, function( unused, column ) { return newCell( rows, column ); } ) ) } ); }
			function removeRow() { if ( merged || rows <= 1 ) return; props.setAttributes( { rows: rows - 1, cells: cells.filter( function( cell ) { return cell.row < rows - 1; } ) } ); setSelected( [] ); }
			function addColumn() { if ( merged || columns >= 20 ) return; props.setAttributes( { columns: columns + 1, cells: cells.concat( Array.from( { length: rows }, function( unused, row ) { return newCell( row, columns ); } ) ) } ); }
			function removeColumn() { if ( merged || columns <= 1 ) return; props.setAttributes( { columns: columns - 1, cells: cells.filter( function( cell ) { return cell.column < columns - 1; } ) } ); setSelected( [] ); }
			function renderCell( cell, section ) {
				const tagName = section === 'head' ? 'th' : 'td';
				return el( tagName, { key: cell.id, className: 'cni-table-plus__cell' + ( selected.indexOf( cell.id ) !== -1 ? ' is-selected' : '' ), style: cellStyle( cell ), rowSpan: cell.rowSpan > 1 ? cell.rowSpan : undefined, colSpan: cell.colSpan > 1 ? cell.colSpan : undefined, 'data-label': section === 'head' || a.hasHeader === false ? '' : headerLabel( cells, cell.column ), onClick: function( event ) { selectCell( cell, event ); } }, el( RichText, { tagName: 'div', value: cell.content || '', placeholder: __( '入力', 'cni-blocks' ), allowedFormats: [ 'core/bold', 'core/italic', 'core/link' ], onChange: function( value ) { updateCell( cell.id, { content: value } ); } } ) );
			}
			function renderSection( tagName, rowIndexes, section ) { return rowIndexes.length ? el( tagName, null, rowIndexes.map( function( rowIndex ) { return el( 'tr', { key: 'row-' + rowIndex }, rowsFrom( cells, rows )[ rowIndex ].map( function( cell ) { return renderCell( cell, section ); } ) ); } ) ) : null; }
			const bodyStart = a.hasHeader !== false ? 1 : 0, bodyEnd = a.hasFooter && rows > bodyStart ? rows - 1 : rows;
			const bodyRows = Array.from( { length: Math.max( 0, bodyEnd - bodyStart ) }, function( unused, index ) { return bodyStart + index; } );

			return el( element.Fragment, null,
				el( BlockControls, null, el( ToolbarGroup, null, el( Button, { disabled: ! canMerge(), onClick: mergeSelection }, __( 'セルを結合', 'cni-blocks' ) ), el( Button, { disabled: ! activeCell || ( activeCell.rowSpan <= 1 && activeCell.colSpan <= 1 ), onClick: unmergeSelection }, __( '結合を解除', 'cni-blocks' ) ) ) ),
				el( InspectorControls, null,
					el( PanelBody, { title: __( '表の設定', 'cni-blocks' ), initialOpen: true },
						el( 'p', { className: 'cni-table-plus__editor-help' }, __( 'クリックで選択、Ctrl/Cmd+クリックで複数選択、Shift+クリックで範囲選択できます。', 'cni-blocks' ) ),
						merged ? el( Notice, { status: 'info', isDismissible: false }, __( '行・列の追加と削除は、結合セルをすべて解除すると利用できます。', 'cni-blocks' ) ) : null,
						el( 'div', { className: 'cni-table-plus__size-buttons' }, el( Button, { variant: 'secondary', disabled: merged || rows >= 30, onClick: addRow }, __( '下に行を追加', 'cni-blocks' ) ), el( Button, { variant: 'secondary', disabled: merged || rows <= 1, onClick: removeRow }, __( '最終行を削除', 'cni-blocks' ) ), el( Button, { variant: 'secondary', disabled: merged || columns >= 20, onClick: addColumn }, __( '右に列を追加', 'cni-blocks' ) ), el( Button, { variant: 'secondary', disabled: merged || columns <= 1, onClick: removeColumn }, __( '最終列を削除', 'cni-blocks' ) ) ),
						el( ToggleControl, { label: __( '表のヘッダー', 'cni-blocks' ), checked: a.hasHeader !== false, onChange: function( value ) { props.setAttributes( { hasHeader: !! value } ); } } ),
						el( ToggleControl, { label: __( '表のフッター', 'cni-blocks' ), checked: !! a.hasFooter, onChange: function( value ) { props.setAttributes( { hasFooter: !! value } ); } } ),
						el( TextControl, { label: __( 'キャプション', 'cni-blocks' ), value: a.caption || '', onChange: function( value ) { props.setAttributes( { caption: value } ); } } ),
						el( SelectControl, { label: __( 'スマホ表示', 'cni-blocks' ), value: a.mobileMode || 'none', options: [ { label: __( 'そのまま表示', 'cni-blocks' ), value: 'none' }, { label: __( '横スクロール', 'cni-blocks' ), value: 'scroll' }, { label: __( '縦表示', 'cni-blocks' ), value: 'stack' } ], onChange: function( value ) { props.setAttributes( { mobileMode: value } ); } } )
					),
					selectedCells.length ? el( PanelBody, { title: selectedCells.length > 1 ? __( '選択セルの一括設定', 'cni-blocks' ) : __( '選択セルの設定', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, { label: __( '水平方向の位置揃え', 'cni-blocks' ), value: selectedValue( 'align' ) || 'left', options: [ { label: __( '左', 'cni-blocks' ), value: 'left' }, { label: __( '中央', 'cni-blocks' ), value: 'center' }, { label: __( '右', 'cni-blocks' ), value: 'right' } ], onChange: function( value ) { updateSelectedCells( { align: value } ); } } ),
						el( SelectControl, { label: __( '縦方向の位置揃え', 'cni-blocks' ), value: selectedValue( 'valign' ) || 'middle', options: [ { label: __( '上', 'cni-blocks' ), value: 'top' }, { label: __( '中央', 'cni-blocks' ), value: 'middle' }, { label: __( '下', 'cni-blocks' ), value: 'bottom' } ], onChange: function( value ) { updateSelectedCells( { valign: value } ); } } ),
						palette( __( '背景色', 'cni-blocks' ), selectedValue( 'backgroundColor' ), function( value ) { updateSelectedCells( { backgroundColor: value || '' } ); } ), palette( __( '文字色', 'cni-blocks' ), selectedValue( 'textColor' ), function( value ) { updateSelectedCells( { textColor: value || '' } ); } )
					) : null,
					el( PanelBody, { title: __( '枠線・余白・色', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, { label: __( '枠線', 'cni-blocks' ), value: a.borderStyle || 'solid', options: [ { label: __( '実線', 'cni-blocks' ), value: 'solid' }, { label: __( '点線', 'cni-blocks' ), value: 'dotted' }, { label: __( '破線', 'cni-blocks' ), value: 'dashed' }, { label: __( 'なし', 'cni-blocks' ), value: 'none' } ], onChange: function( value ) { props.setAttributes( { borderStyle: value } ); } } ),
						a.borderStyle !== 'none' ? el( RangeControl, { label: __( '枠線の太さ（px）', 'cni-blocks' ), value: numberOr( a.borderWidth, 1 ), min: 1, max: 10, onChange: function( value ) { props.setAttributes( { borderWidth: value } ); } } ) : null,
						el( RangeControl, { label: __( 'セルの内側余白（px）', 'cni-blocks' ), value: numberOr( a.cellPadding, 12 ), min: 0, max: 60, onChange: function( value ) { props.setAttributes( { cellPadding: value } ); } } ),
						el( ToggleControl, { label: __( '行を交互に色分け', 'cni-blocks' ), checked: !! a.striped, onChange: function( value ) { props.setAttributes( { striped: !! value } ); } } ),
						a.borderStyle !== 'none' ? palette( __( '枠線の色', 'cni-blocks' ), a.borderColor, function( value ) { props.setAttributes( { borderColor: value || '#dddddd' } ); } ) : null,
						palette( __( '表の背景色', 'cni-blocks' ), a.tableBackgroundColor, function( value ) { props.setAttributes( { tableBackgroundColor: value || '' } ); } ), a.hasHeader !== false ? palette( __( 'ヘッダーの背景色', 'cni-blocks' ), a.headerBackgroundColor, function( value ) { props.setAttributes( { headerBackgroundColor: value || '#f5f5f5' } ); } ) : null
					)
				),
				el( 'div', wrapperProps( a, false ), el( 'div', { className: 'cni-table-plus__viewport' }, el( 'table', { className: 'cni-table-plus__table' }, a.caption ? el( 'caption', null, a.caption ) : null, a.hasHeader !== false ? renderSection( 'thead', [ 0 ], 'head' ) : null, renderSection( 'tbody', bodyRows, 'body' ), a.hasFooter && rows > bodyStart ? renderSection( 'tfoot', [ rows - 1 ], 'foot' ) : null ) ) )
			);
		},
		save: function( props ) {
			return saveTable( props.attributes, false );
		},
		deprecated: [ {
			attributes: { rows: { type: 'number', default: 3 }, columns: { type: 'number', default: 3 }, cells: { type: 'array', default: [] }, hasHeader: { type: 'boolean', default: true }, hasFooter: { type: 'boolean', default: false }, caption: { type: 'string', default: '' }, mobileMode: { type: 'string', default: 'scroll' }, showScrollHint: { type: 'boolean', default: true }, borderStyle: { type: 'string', default: 'solid' }, borderWidth: { type: 'number', default: 1 }, borderColor: { type: 'string', default: '#dddddd' }, cellPadding: { type: 'number', default: 12 }, tableBackgroundColor: { type: 'string', default: '' }, headerBackgroundColor: { type: 'string', default: '#f5f5f5' }, striped: { type: 'boolean', default: false } },
			save: function( props ) { return saveTable( props.attributes, true ); },
		} ],
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );
